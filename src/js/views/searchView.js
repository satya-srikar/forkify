import { elements, elementStrings } from "./base";

export const getInput = () => elements.searchInput.value;

export const clearInput = () => {
    elements.searchInput.value = "";
};

export const clearResults = () => {
    elements.searchResultList.innerHTML = "";
    elements.searchResultsPages.innerHTML = "";
};

export const highlightSelected = (id) => {
    const resultsArr = Array.from(document.querySelectorAll(".results__link"));
    resultsArr.forEach((el) => {
        if (el) el.classList.remove("results__link--active");
    });

    const el = document.querySelector(`.results__link[href*="#${id}"]`);
    if (el) el.classList.add("results__link--active");
};

export const limitRecipeTitle = (title, limit = 17) => {
    if (title.length > limit) {
        let newTitle = [];
        title.split(" ").reduce((acc, cur) => {
            if (acc + cur.length <= limit) {
                newTitle.push(cur);
            }
            return acc + cur.length;
        }, 0);

        return `${newTitle.join(" ")} ...`;
    }
    return title;
};

const renderRecipe = (recipe) => {
    const markup = `
    <li>
        <a class="results__link" href="#${recipe.recipe_id}">
            <figure class="results__fig">
                <img src="${recipe.image_url}" alt="${recipe.title}">
            </figure>
            <div class="results__data">
                <h4 class="results__name">${limitRecipeTitle(recipe.title)}</h4>
                <p class="results__author">${recipe.publisher}</p>
            </div>
        </a>
    </li>
    `;
    elements.searchResultList.insertAdjacentHTML("beforeend", markup);
};

const createButton = (page, type) => `
    <button class="btn-inline results__btn--${type}" data-goto=${
    type === "prev" ? page - 1 : page + 1
}>
        
        <span>Page ${type === "prev" ? page - 1 : page + 1}</span>
        <svg class="search__icon">
            <use href="img/icons.svg#icon-triangle-${
                type === "prev" ? "left" : "right"
            }"></use>
        </svg>
    </button>
`;

const renderButtons = (page, numResults, resultsPerPage) => {
    const pages = Math.ceil(numResults / resultsPerPage);
    let button;
    if (page === 1) {
        //Only one button to go to next page
        button = createButton(page, "next");
    } else if (page < pages) {
        //Both buttons
        button = `
            ${createButton(page, "next")}
            ${createButton(page, "prev")}
            `;
    } else if (page === pages && pages > 1) {
        //Only one button to go to previous page
        button = createButton(page, "prev");
    }

    elements.searchResultsPages.insertAdjacentHTML("afterbegin", button);
};

export const renderResults = (recipes, page = 1, resultsPerPage = 10) => {
    //render results of current page
    const start = (page - 1) * resultsPerPage;
    const end = page * resultsPerPage;

    recipes.slice(start, end).forEach(renderRecipe);

    //render pagination buttons
    renderButtons(page, recipes.length, resultsPerPage);
};
