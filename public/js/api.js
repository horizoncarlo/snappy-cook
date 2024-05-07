const API_URL = `http://${window.location.host}/`;

// #region Generic underlying functions
function _get(url) { return _fetchWithLoading(url, 'GET'); }
function _post(url, body) { return _fetchWithLoading(url, 'POST', JSON.stringify(body)); }
function _put(url, body) { return _fetchWithLoading(url, 'PUT', JSON.stringify(body)); }
function _delete(url) { return _fetchWithLoading(url, 'DELETE'); }

async function _fetchWithLoading(url, method, body) {
  state.loading = true;
  try {
    const options = {
      method: method ?? 'GET'
    };
    if (body) {
      options.body = body;
    }
    
    const response = await fetch(url, options);
    if (response.ok) {
      return response.json();
    }
    
    throw new Error(response.status + ": " + response.statusText);
  } catch (error) {
    throw error;
  } finally {
    state.loading = false;
  }
}
// #endregion

async function getAllTagsAPI() {
  return _get(API_URL + 'tags');
}

async function getAllDaysAPI() {
  return _get(API_URL + 'days');
}

let lastSortCol = 'name';
let lastSortOrder = ''; // Ascending sort, descending is '-'
async function getAllRecipesAPI(sortCol, initSort) {
  let apiEndpoint = 'recipes';
  
  // If we don't have a sort, default to our last
  if (typeof sortCol !== 'string' || sortCol.trim().length === 0) {
    sortCol = lastSortCol;
  }
  else if (sortCol === lastSortCol) {
    if (!initSort) { // Don't toggle our sort on any programmatic init, non-user driven sort
      lastSortOrder = lastSortOrder === '' ? '-' : '';
    }
  }
  // By default is switching the sort column revert to ascending
  // Unless of course we're doing changedDate, which is hardcoded special case to be descending
  else {
    lastSortOrder = sortCol === 'changedDate' ? '-' : '';
  }
  lastSortCol = sortCol;
  
  apiEndpoint += '?_sort=' + lastSortOrder + sortCol;
  return _get(API_URL + apiEndpoint);
}

async function createRecipeAPI(recipe) {
  return _post(API_URL + 'recipes', recipe);
}

async function updateRecipeAPI(recipe) {
  return _put(API_URL + 'recipes/' + recipe.id, recipe);
}

async function deleteRecipeAPI(deleteId) {
  return _delete(API_URL + 'recipes/' + deleteId);
}

async function updateTagsAPI(tags) {
  return _put(API_URL + 'tags', { all: tags });
}

async function createDayAPI(day) {
  const dayClone = JSON.parse(JSON.stringify(day));
  delete dayClone.index;
  return _post(API_URL + 'days', dayClone);
}

async function updateDayAPI(day) {
  const dayClone = JSON.parse(JSON.stringify(day));
  delete dayClone.index;
  return _put(API_URL + 'days/' + day.id, day);
}

async function deleteDayAPI(deleteId) {
  return _delete(API_URL + 'days/' + deleteId);
}
