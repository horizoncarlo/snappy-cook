function getAllRecipes(sortOrder, event) {
  // If we have an event passed and the target isn't a TH/TD element, we want to abort the sort
  // This is because we might have another element in the header that was clicked and we don't want to unintentionally sort
  // The real example is the search field and add new button
  if (typeof sortOrder === 'string' &&
      event && event.target && event.target.tagName) {
    if (event.target.tagName !== 'TH' &&
        event.target.tagName !== 'TD') {
      return;
    }
  }
  
  getAllRecipesAPI(sortOrder).then(res => {
    console.log("-> Recipes", res);
    state.recipes = res;
  }).catch(err => {
    notifyError("Error retrieving recipes: " + err, "danger");
    console.error(err);
  });
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
    htmlEditor.loadHTML(state.recipeIn?.notes);
  }
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
