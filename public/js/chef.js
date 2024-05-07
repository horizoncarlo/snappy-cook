var state = {
  bodyReady: false,
  searchIn: '',
  searchCount: null,
  recipes: [],
  recipeIn: {},
  tags: [],
  tagIn: '',
  week: [],
  dayIn: {}
}

function init() {
  resetRecipeIn();
  setupWeekdays();
  
  if (isMobileSize()) {
    addCSSLink('mobile-css', './css/mobile.css');
  }
  
  // Listen for Alpine to be done setting up
  document.addEventListener('alpine:initialized', () => {
    alpineInit();
    
    // Next listen for Shoelace Style components to be done setting up
    customElements.whenDefined('sl-alert').then(() => { shoelaceInit(); });
  });
}
init();

function alpineInit() {
  state = Alpine.reactive(state);
}

function shoelaceInit() {
  getAllRecipes('', true);
  getAllTags();
}

function setupWeekdays() {
  state.week = Array(7).fill().map(() => ({
    dayName: '',
    dayNumber: 0,
    recipe: '',
    tags: []
  }));
  
  let today = new Date();
  for (let i = 0; i < state.week.length; i++) {
    state.week[i].dayName =
      today.toLocaleDateString('en', {
        weekday: 'long'
      });
    state.week[i].dayNumber =
      today.toLocaleDateString('en', {
        day: 'numeric'
      });
    today.setDate(today.getDate() + 1);
  }
}

function resetRecipeIn(htmlEditor, replaceWith) {
  if (replaceWith) {
    // Clone so resetting/editing the fields doesn't update the table before doing a save
    state.recipeIn = JSON.parse(JSON.stringify(replaceWith));
  }
  else {
    state.recipeIn = {
      changedDate: "",
      name: "",
      notes: "",
      tags: []
    }
  }
  
  if (htmlEditor) {
    // TODO Don't get easily XSS attacked, so parse/cleanup HTML first with something like sanitize-html?
    htmlEditor.loadHTML(state.recipeIn?.notes);
  }
}

function getAllRecipes(sortOrder) {
  getAllRecipesAPI(sortOrder).then(res => {
    console.log("Get all recipes result", res);
    state.recipes = res;
  }).catch(err => {
    notifyError("Error retrieving recipes: " + err, "danger");
    console.error(err);
  });
}

function persistRecipe(dialog) {
  // Validate the incoming data
  if (!state.recipeIn.name || typeof state.recipeIn.name !== 'string' ||
      state.recipeIn.name.trim().length <= 0) {
    notifyError('Meal Name is required');
    return;
  }
  
  const call = state.recipeIn.id ? updateRecipeAPI : createRecipeAPI;
  
  console.log("Save/update recipe", state.recipeIn);
  
  // Set the changed date
  state.recipeIn.changedDate = new Date().toISOString();
  
  call(state.recipeIn).then(res => {
    console.log("Save recipe successful", res);
    getAllRecipes();
    
    if (dialog) {
      dialog.hide();
    }
  }).catch(err => {
    notifyError("Error on saving a new meal: " + err);
    console.error(err);
  });
}

function deleteRecipe(deleteId) {
  if (!window.confirm("Are you sure you want to delete this recipe?")) {
    return;
  }
  
  console.log("Delete recipe", deleteId);
  
  deleteRecipeAPI(deleteId).then(res => {
    console.log("Delete done", res);
    notify("Successfully deleted <b>" + res.name + "</b> meal");
    getAllRecipes();
  }).catch(err => {
    notifyError("Error on deleting a meal");
    console.error(err);
  });
}

function getAllTags() {
  getAllTagsAPI().then(res => {
    if (res && res.all) {
      state.tags = res.all.sort();
      console.log("Got all tags", state.tags);
    }
    else {
      throw new Error("Invalid tag structure");
    }
  }).catch(err => {
    notifyError("Error retrieving tags: " + err, "danger");
    console.error(err);
  });
}

function addTag(recipeObj) {
  if (state.tagIn && state.tagIn.trim().length > 0) {
    // Check uniqueness of desired tag
    const duplicates = state.tags.filter((tag => tag && tag.toLowerCase() === state.tagIn.toLowerCase()));
    if (duplicates && duplicates.length > 0) {
      notify("Tag <b>" + state.tagIn + "</b> already exists", 'warning');
      state.tagIn = '';
      return;
    }
    
    // Persist new tag to the API and locally
    state.tags.push(state.tagIn);
    state.tags = state.tags.sort();
    updateTagsAPI(state.tags);
    
    // Add as a selection to our recipe
    if (recipeObj) {
      selectTag(recipeObj, state.tagIn);
    }
    
    // Reset our tag input after
    state.tagIn = '';
  }
}

function selectTag(recipeObj, tag) {
  if (recipeObj && recipeObj.tags) {
    if (recipeObj.tags.length > 0 && recipeObj.tags.indexOf(tag) !== -1) {
      recipeObj.tags.splice(recipeObj.tags.indexOf(tag), 1);
    }
    else {
      recipeObj.tags.push(tag);
    }
  }
}

function deleteTag(index, tag) {
  // Determine how many recipes use the tag we want to delete
  const recipeUsedCount = state.recipes.filter(recipe => recipe.tags.includes(tag)).length;
  
  if (window.confirm("Are you sure you want to delete this tag? It is used in " + recipeUsedCount + " recipes.")) {
    // Remove the tag from our available options
    state.tags.splice(index, 1);
    updateTagsAPI(state.tags);
    
    // Clean up any related recipes that still have the tag
    state.recipes.forEach(recipe => {
      const foundAt = recipe.tags.indexOf(tag);
      if (foundAt !== -1) {
        recipe.tags.splice(foundAt, 1);
        updateRecipeAPI(recipe);
      }
    });
  }
}

function matchesSearch(recipeObj, searchText) {
  if (searchText && typeof searchText === 'string' && searchText.trim().length > 0) {
    return recipeObj.name?.toLowerCase().includes(searchText.toLowerCase()) ||
           recipeObj.tags.filter(tag => tag.toLowerCase().includes(searchText.toLowerCase())).length > 0;
  }
  return true;
}
