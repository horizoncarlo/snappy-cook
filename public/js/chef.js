var state = {
  bodyReady: false,
  searchIn: '',
  searchCount: null,
  recipes: [],
  recipeIn: {}, /*
    id: "",
    changedDate: "",
    name: "",
    notes: "",
    tags: []
  */
  tags: [],
  tagIn: '',
  week: [],
  dayIn: {} /*
    id: "",
    index: -1,
    dayName: '',
    dayNumber: 0,
    recipeId: '',
    tags: []
  */
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
  getAllTags();
  getAllRecipes('', true);
  getAllDays();
}

// TODO Split Days, Tags, and Recipes into separate JS files for management and readability?

function getAllDays() {
  getAllDaysAPI().then(res => {
    // Prefill our days for this week
    state.week = Array(7).fill().map(() => ({
      index: -1,
      dayName: '',
      dayNumber: 0,
      recipeId: '',
      tags: []
    }));
    
    let today = new Date();
    for (let i = 0; i < state.week.length; i++) {
      state.week[i].dayName =
        today.toLocaleDateString('en', {
          weekday: 'long'
        });
      state.week[i].dayNumber =
        parseInt(today.toLocaleDateString('en', {
          day: 'numeric'
        }));
      
      // Load any matching stored day
      if (res && res.length > 0) {
        const match = res.filter(day => {
          return day.dayName === state.week[i].dayName &&
                 day.dayNumber === state.week[i].dayNumber });
        if (match && match.length > 0) {
          state.week[i] = match[0];
        }
      }
      
      // Always set our UI level index, then keep looping
      state.week[i].index = i;
      today.setDate(today.getDate() + 1);
    }
    
    // Clean up and trim old data
    const toDelete = res.filter(day => {
      return day.dayNumber < state.week[0].dayNumber ||
             day.dayNumber > state.week[6].dayNumber;
    });
    
    if (toDelete.length > 0) {
      toDelete.forEach(day => {
        deleteDayAPI(day.id);
      });
    }
  }).catch(err => {
    notifyError("Error retrieving meal plan: " + err, "danger");
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

function redoWeek() {
  state.week.map(day => {
    redoDay(day, false, true);
  });
}

function redoDay(day, isRedone, persistAfter) {
  // Determine if we have tags that apply - if so, filter the list, otherwise use all recipes
  let newRecipeId = ''; // Default to blank if we can't find a match
  let possibleRecipes = [];
  if (day.tags.length > 0) {
    possibleRecipes = state.recipes.filter(recipe => {
      return day.tags.some(tag => recipe.tags.includes(tag));
    });
  }
  else {
    possibleRecipes = state.recipes;
  }
  
  // If we only have a single recipe see if we've set it already, in which case we bail
  if (possibleRecipes.length === 1) {
    newRecipeId = possibleRecipes[0].id;
    if (newRecipeId === day.recipeId) {
      return;
    }
  }
  // Otherwise we randomize between available recipes
  if (possibleRecipes.length > 0) {
    const randIndex = randomRange(0, possibleRecipes.length-1);
    newRecipeId = possibleRecipes[randIndex].id;
    
    // If we get the same recipe roll again, to try to avoid repetition a little bit
    if (newRecipeId === day.recipeId && !isRedone) {
      return redoDay(day, true);
    }
  }
  
  day.recipeId = newRecipeId;
  
  if (persistAfter) {
    persistDay(day);
  }
}

function persistDay(day) {
  // If we're updating our state day, which means we're editing Tags, put the changes back into state
  if (day === state.dayIn) {
    state.week[state.dayIn.index] = state.dayIn;
  }
  
  if (day.id) {
    updateDayAPI(day).then().catch(err => {
      notifyError("Failed to update meal plan day: " + err, "danger");
      console.error(err);
    })
  }
  else {
    createDayAPI(day).then(savedDay => {
      day = savedDay;
    }).catch(err => {
      notifyError("Failed to create meal plan day: " + err, "danger");
      console.error(err);
    })
  }
}