var state = {
  bodyReady: false,
  recipes: [],
  recipeIn: {},
  tags: [],
  tagIn: '',
}

function init() {
  resetRecipeIn();
  
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
  getAllRecipes('changedDate');
  getAllTags();
}

function resetRecipeIn(htmlEditor, replaceWith) {
  if (replaceWith) {
    // Clone so resetting/editing the fields doesn't update the table before doing a save
    state.recipeIn = cloneObject(replaceWith);
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
    // TODO Probably don't get easily XSS attacked, so parse/cleanup HTML first?
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
  const call = state.recipeIn.id ? updateRecipeAPI : saveRecipeAPI;
  
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
    // TODO Check uniqueness of tags
    // TODO Persist new tag to the API
    state.tags.push(state.tagIn);
    
    // Add as a selection to our recipe
    selectTag(recipeObj, state.tagIn);
    
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

function deleteTag(index) {
  // TODO Nicer looking confirm? Make a generic dialog with sl-dialog and a util function to show it?
  if (window.confirm("Are you sure you want to delete this tag?")) {
    // TODO Should removing a tag update all Recipes to clear it too?
    // TODO Persist tag removal to the API
    state.tags.splice(index, 1);
  }
}
