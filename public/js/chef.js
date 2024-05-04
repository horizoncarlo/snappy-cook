var state = {
  bodyReady: false,
  recipes: [],
  recipeIn: {}
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
  getAllRecipes();
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
      tags: ""    
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

function persistRecipe() {
  const call = state.recipeIn.id ? updateRecipeAPI : saveRecipeAPI;
  
  console.log("Save/update recipe", state.recipeIn);
  
  // Set the changed date
  state.recipeIn.changedDate = new Date().toISOString();
  
  call(state.recipeIn).then(res => {
    console.log("Save recipe successful", res);
    getAllRecipes();
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