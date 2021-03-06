import Search from "./models/Search";
import * as searchView from "./views/searchView";
import * as recipeView from "./views/recipeView";
import * as listView from "./views/listView";
import * as likesView from "./views/likesView";
import { elements, renderLoader, clearLoader } from "./views/base";
import Recipe from "./models/Recipe";
import List from "./models/List";
import Likes from "./models/Likes";

/*Global state of the app
 *- Search object
 *- Current recipe object
 *- Shopping list object
 *- Liked recipes
 */
const state = {};

/**
 * SEARCH CONTROLLER
 */

const controlSearch = async () => {
    //1. Get query from view
    const query = searchView.getInput();

    if (query) {
        //2. New search object and add to state
        state.search = new Search(query);

        //3. Prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchResults);

        try {
            //4. Search for recipes
            await state.search.getResults();

            //5. Render results on UI
            clearLoader();
            searchView.renderResults(state.search.result);
        } catch (err) {
            alert("Something wrong with the search...");
            clearLoader();
        }
    }
};

elements.searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    controlSearch();
});

elements.searchResultsPages.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-inline");
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }
});

/**
 * RECIPE CONTROLLER
 */
const controlRecipe = async () => {
    //1. Get ID from URL
    const id = window.location.hash.replace("#", "");

    if (id) {
        //2. Prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        //Highlight selected search item
        if (state.search) searchView.highlightSelected(id);

        //3. Create new recipe object
        state.recipe = new Recipe(id);

        try {
            //4. Get recipe data
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();

            //5. Calculate servings and time
            state.recipe.calcServings();
            state.recipe.calcTime();

            //6. Render recipe
            clearLoader();
            recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
        } catch (error) {
            alert("Error processing recipe!");
        }
    }
};

// window.addEventListener("hashchange", controlRecipe);
// window.addEventListener('load', controlRecipe);
["hashchange", "load"].forEach((event) =>
    window.addEventListener(event, controlRecipe)
);

/**
 * LIST CONTROLLER
 */
const controlList = () => {
    //Create a new list IF there is none yet
    if (!state.list) state.list = new List();

    //Add each ingredient to the list and UI
    state.recipe.ingredients.forEach((el) => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
};

//Handle delete and update list item events
elements.shopping.addEventListener("click", (e) => {
    const id = e.target.closest(".shopping__item").dataset.itemid;

    const deleteItem = () => {
        //Delete from state
        state.list.deleteItem(id);

        //Delete from UI
        listView.deleteItem(id);
    };

    //Handle the delete button
    if (e.target.matches(".shoppind__delete, .shopping__delete *")) {
        deleteItem();
    } else if (e.target.matches(".shopping__count-value")) {
        //Handle count update
        const val = parseFloat(e.target.value, 10);
        if (val > 0) {
            state.list.updateCount(id, val);
        } else {
            deleteItem();
        }
    }
});

/**
 * LIKE CONTROLLER
 */
const controlLike = () => {
    if (!state.likes) state.likes = new Likes();
    const currentId = state.recipe.id;

    //USer has NOT yet liked current recipe
    if (!state.likes.isLiked(currentId)) {
        //Add like to the state
        const newLike = state.likes.addLike(
            currentId,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );

        //Toggle the like button
        likesView.toggleLikeBtn(true);
        likesView.toggleLikeMenu(state.likes.getNumLikes());

        //Add like to UI list
        likesView.renderLike(newLike);

        //User HAS liked current recipe
    } else {
        //Remove like to the state
        state.likes.deleteLike(currentId);

        //Toggle the like button
        likesView.toggleLikeBtn(false);

        //Remove like to UI list
        likesView.deleteLike(currentId);
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
};

//Restore liked recipes on page load
window.addEventListener("load", () => {
    state.likes = new Likes();

    //Restore likes
    state.likes.readStorage();

    //Toggle like menu button
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    //Render the existing Likes
    state.likes.likes.forEach((like) => likesView.renderLike(like));
});

//Handling recipe button clicks
elements.recipe.addEventListener("click", (e) => {
    if (e.target.matches(".btn-decrease, .btn-decrease *")) {
        //Decrease button is clicked
        if (state.recipe.servings > 1) {
            state.recipe.updateServings("dec");
            recipeView.updateServingsIngredients(state.recipe);
        }
    } else if (e.target.matches(".btn-increase, .btn-increase *")) {
        //Increase button clicked
        state.recipe.updateServings("inc");
        recipeView.updateServingsIngredients(state.recipe);
    } else if (e.target.matches(".recipe__btn--add, .recipe__btn--add *")) {
        //Add ingredient s to shopping list
        controlList();
    } else if (e.target.matches(".recipe__love, .recipe__love *")) {
        //Like controller
        controlLike();
    }
});
