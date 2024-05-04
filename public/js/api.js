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

let lastSortCol = 'changedDate';
let lastSortOrder = '-';
async function getAllRecipesAPI(sortCol) {
  let apiEndpoint = 'recipes';
  
  // TTODO Clean up this messy sorting, given init sorting vs column - we don't want changedDate sort to reverse when deleting a recipe and refetching the list, but we want asc/desc to toggle on manual column sort
  if (typeof sortCol !== 'string' || sortCol.trim().length === 0) {
    sortCol = lastSortCol;
  }
  
  if (sortCol !== lastSortCol) {
    // TODO Used to use this but no longer working, see https://github.com/typicode/json-server/issues/1498: + '&_order=' + lastSortOrder;
    lastSortOrder = lastSortOrder === '' ? '-' : '';
  }
  lastSortCol = sortCol;
  apiEndpoint += '?_sort=' + lastSortOrder + sortCol;
  
  return _get(API_URL + apiEndpoint);
}

async function saveRecipeAPI(recipe) {
  return _post(API_URL + 'recipes', recipe);
}

async function updateRecipeAPI(recipe) {
  return _put(API_URL + 'recipes/' + recipe.id, recipe);
}

async function deleteRecipeAPI(deleteId) {
  return _delete(API_URL + 'recipes/' + deleteId);
}