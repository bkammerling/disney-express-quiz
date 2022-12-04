const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const createError = require('http-errors');

let session;

router.get('/', async function(req, res, next) {
  session = req.session;
  session.score = 0;
  res.redirect('/quiz/1');
});

/* GET home page. */
router.get('/quiz/:roundNumber', async function(req, res, next) {
  session = req.session;
  const round = req.params.roundNumber || 1;
  session.round = round;

  // Fetch data from external API
  const characters = await getCharacters(round).catch(err => next(createError(err)) );
  // Create array of random numbers for our array of random characters
  const randomNumbers = getRandomNumbers(49, 4);
  const characterArray = randomNumbers.map(e => characters.items[e])
  // Get random number between 0 and 3 for our character for this round
  const chosenIndex = Math.floor(Math.random() * 4);
  // Add index to session so we know if user is correct
  session.chosenIndex = chosenIndex;
  
  res.render('index', { 
    title: 'Disney Quiz',
    description: 'Do you know the 10 Disney characters?',
    characters: characterArray,
    chosenIndex,
    round: round,
  });
});

router.get('/quiz/:roundNumber/:answer', async function(req, res, next) {
  session = req.session;
  const round = req.params.roundNumber;
  // score the user comparing user answer with correct answer (chosenIndex)
  session.score = (session.score || 0) + (req.params.answer == session.chosenIndex)
  if(round >= 10) {
    res.redirect( '/end')
  } else {
    res.redirect( `/quiz/${parseInt(round) + 1}`);
  }
  
})

router.get('/end', function(req, res, next) {
  session = req.session;
  const score = session.score;
  res.render('results', { 
    title: 'Disney Quiz',
    finalScore: score
  });
})

const getCharacters = async (page) => {
  const res = await fetch(`https://api.disneyapi.dev/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `query ($page: Int!) {
        characters(page: $page) {
          items {
            _id
            name
            imageUrl
          }
          paginationInfo {
            hasPreviousPage
            hasNextPage
            pageItemCount
            totalPages
          }
        }
      }`,
      variables: {
        page: parseInt(page)
      }
    })
  })
  if (!res.ok) {
    const message = `There's been a problem finding disney characters: ${res.status}`;
    throw new Error(message);
  }
  const data = await res.json()
  return data?.data?.characters
}

const getRandomNumbers = (maxNr, size) => {
  let randomNumbers = [];

  const generateUniqueRandom = () => {
    //Generate random number
    const random = Math.floor(Math.random() * (maxNr));

    if(!randomNumbers.includes(random)) {
      randomNumbers.push(random);
    } else { 
      generateUniqueRandom(maxNr)
      return;
    }
    if(randomNumbers.length < size) generateUniqueRandom(maxNr);
  }
  generateUniqueRandom()
  return randomNumbers;
}


module.exports = router;
