const API_KEY = "d0ede01d19277140ae5f70cb47ed245b"

async function searchActor(name) {
  const url = `https://api.themoviedb.org/3/search/person?api_key=${API_KEY}&query=${name}`
  const res = await fetch(url)
  const data = await res.json()
  return data.results[0]
}

async function connect() {
  const aName = actorA.value
  const bName = actorB.value

  const a = await searchActor(aName)
  const b = await searchActor(bName)

  output.textContent = `
A: ${a.name} (id ${a.id})
B: ${b.name} (id ${b.id})
`
}
