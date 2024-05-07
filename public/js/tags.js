function getAllTags() {
  getAllTagsAPI().then(res => {
    if (res && res.all) {
      console.log("-> Tags", res.all);
      state.tags = res.all.sort();
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
    // TODO If a unique tag is added, just select it instead, so that the field can be used as a search as well. Label field as such?
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
    
    // TODO Remove tag from any existing meal plan days and persist those changes
    
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
