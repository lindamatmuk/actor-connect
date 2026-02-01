// =======================
// CONFIG
// =======================
const API_KEY = "d0ede01d19277140ae5f70cb47ed245b";
const MAX_DEPTH = 6; // allow more hops

// caches to avoid duplicate API calls
const actorMovieCache = new Map();
const movieCastCache = new Map();
const actorIdCache = new Map();
const movieIdCache = new Map();

// =======================
// TMDB API helpers
// =======================
async function searchActor(name) {
  const url = `https://api.themoviedb.org/3/search/person?api_key=${API_KEY}&query=${encodeURIComponent(name)}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results?.[0] || null;
}

async function getMovies(actorId) {
  if (actorMovieCache.has(actorId)) return actorMovieCache.get(actorId);
  const res = await fetch(`https://api.themoviedb.org/3/person/${actorId}/movie_credits?api_key=${API_KEY}`);
  const data = await res.json();
  const movies = data.cast || [];
  actorMovieCache.set(actorId, movies);
  return movies;
}

async function getCast(movieId) {
  if (movieCastCache.has(movieId)) return movieCastCache.get(movieId);
  const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${API_KEY}`);
  const data = await res.json();
  const cast = data.cast || [];
  movieCastCache.set(movieId, cast);
  return cast;
}

async function searchActorById(id) {
  if (actorIdCache.has(id)) return actorIdCache.get(id);
  const res = await fetch(`https://api.themoviedb.org/3/person/${id}?api_key=${API_KEY}`);
  const data = await res.json();
  actorIdCache.set(id, data);
  return data;
}

async function getMovieById(id) {
  if (movieIdCache.has(id)) return movieIdCache.get(id);
  const res = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}`);
  const data = await res.json();
  movieIdCache.set(id, data);
  return data;
}

// =======================
// BFS search for connection
// =======================
async function findConnection(actorAId, actorBId) {
  const queue = [[{ actorId: actorAId, viaMovieId: null }]];
  const visited = new Set();

  while (queue.length) {
    const path = queue.shift();
    const currentNode = path[path.length - 1];
    const currentActorId = currentNode.actorId;

    if (visited.has(currentActorId)) continue;
    visited.add(currentActorId);

    // Depth limit
    if (path.length > MAX_DEPTH) continue;

    const movies = await getMovies(currentActorId);

    for (let movie of movies) {
      const cast = await getCast(movie.id);

      for (let coActor of cast) {
        if (coActor.id === currentActorId) continue;

        const newPath = [...path, { actorId: coActor.id, viaMovieId: movie.id }];
        if (coActor.id === actorBId) return newPath;

        queue.push(newPath);
      }
    }
  }
  return null; // no path found
}

// =======================
// format path with clickable links
// =======================
async function formatPath(path) {
  if (!path || path.length < 2) return "No connection found.";

  let output = "";

  for (let i = 0; i < path.length - 1; i++) {
    const actorNode = path[i];
    const nextNode = path[i + 1];

    const actorData = await searchActorById(actorNode.actorId);
    const movieData = await getMovieById(nextNode.viaMovieId);
    const nextActorData = await searchActorById(nextNode.actorId);

    output += `<a href="https://www.themoviedb.org/person/${actorData.id}" target="_blank">${actorData.name}</a> `;
    output += `was in <a href="https://www.themoviedb.org/movie/${movieData.id}" target="_blank">"${movieData.title}"</a> `;
    output += `with <a href="https://www.themoviedb.org/person/${nextActorData.id}" target="_blank">${nextActorData.name}</a><br>`;
  }

  return output;
}

// =======================
// main connect function
// =======================
async function connect() {
  const aName = actorA.value.trim();
  const bName = actorB.value.trim();
  const outDiv = document.getElementById("output");

  if (!aName || !bName) {
    outDiv.innerHTML = "Please enter both actor names.";
    return;
  }

  const actorAData = await searchActor(aName);
  const actorBData = await searchActor(bName);

  if (!actorAData || !actorBData) {
    outDiv.innerHTML = "Could not find one or both actors.";
    return;
  }

  outDiv.innerHTML = "Searching for connection... (this may take up to 10–15 seconds)";

  const path = await findConnection(actorAData.id, actorBData.id);
  const formatted = await formatPath(path);

  outDiv.innerHTML = formatted;
}
