// TODO Probably wrap our json-server in Node for better middleware and security and just cause raw dogging json-server on a deploy seems a bit wild
const API_URL = `http://${window.location.host}/`;

async function _get(url) {
  const response = await fetch(url);
  if (response.ok) {
    return await response.json();
  }
  return Promise.reject(response.status + ": " + response.statusText);
}

async function _post(url, body) {
  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(body)
  });
  if (response.ok) {
    return await response.json();
  }
  return Promise.reject(response.status + ": " + response.statusText);
}

async function _put(url, body) {
  const response = await fetch(url, {
    method: "PUT",
    body: JSON.stringify(body)
  });
  if (response.ok) {
    return await response.json();
  }
  return Promise.reject(response.status + ": " + response.statusText);
}

async function _delete(url) {
  const response = await fetch(url, { method: "DELETE" });
  if (response.ok) {
    return await response.json();
  }
  return Promise.reject(response.status + ": " + response.statusText);
}

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
  
  // TODO Used to use this but no longer working, see https://github.com/typicode/json-server/issues/1498: + '&_order=' + lastSortOrder;
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