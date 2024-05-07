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

function persistDay(day, dialog) {
  // If we're updating our state day, which means we're editing Tags, put the changes back into state
  if (day === state.dayIn) {
    state.week[state.dayIn.index] = state.dayIn;
  }
  
  if (day.id) {
    updateDayAPI(day).then(() => {
      if (dialog) {
        dialog.hide();
      }
    }).catch(err => {
      notifyError("Failed to update meal plan day: " + err, "danger");
      console.error(err);
    });
  }
  else {
    createDayAPI(day).then(savedDay => {
      day = savedDay;
      
      if (dialog) {
        dialog.hide();
      }
    }).catch(err => {
      notifyError("Failed to create meal plan day: " + err, "danger");
      console.error(err);
    })
  }
}
