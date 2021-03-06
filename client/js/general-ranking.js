import { createBestPlayerInsert, createAllScoreRow, createCampusRaw, createCampusInsert } from './components/rankings.js'
import { getAllScores, getUser } from './api.js'

const bestPlayerElement = document.getElementById('best_player')
const allScoresElement = document.getElementById('all_scores_list')
const campusScoresElement = document.getElementById('campus_ranking_list')
const bestCampusElement = document.getElementById('best_campus')
const worstCampusElement = document.getElementById('worst_campus')

const campusList = [
  'Paris',
  'Reims',
  'Bordeaux',
  'Lille',
  'Biarritz',
  'Lyon',
  'Toulouse',
  'Bruxelles',
  'La Loupe',
  'Tours',
  'Orléans',
  'Marseille',
  'Strasbourg',
  'Nantes'
]

// campus ranking
const getCampusRanking = users => {
  const allCampusScoresArr = []

  for (const campus of campusList) {
    const campusScoreList = users.filter(u => u.campus === campus)
    const campusNbStudents = campusScoreList.length

    if (campusNbStudents > 0) {
      const campusGeneralScore = campusScoreList
        .map(s => s.bestScore)
        .reduce((a, b) => a + b) / campusNbStudents
      const campusStats = {
        name: campus,
        score: campusGeneralScore,
        nbStudents: campusNbStudents
      }

      allCampusScoresArr.push(campusStats)
    }
  }
  return allCampusScoresArr
    .sort((a, b) => b.score - a.score)
}

const showCampusRanking = async users => {
  const campusRanking = await getCampusRanking(users)
  const iterator = campusRanking.keys()

  for (const key of iterator) {
    campusRanking[key].position = key + 1
  }

  campusScoresElement.innerHTML = campusRanking
    .map(createCampusRaw)
    .join('')
}

// campus inserts
const getBestCampus = async users => {
  const campusRanking = await getCampusRanking(users)

  campusRanking
    .slice(0, 1)
    .map(campus => {
      bestCampusElement.innerHTML = createCampusInsert(campus)
    })
}

const getWorstCampus = async users => {
  const campusRanking = await getCampusRanking(users)

  campusRanking
    .slice(-1)
    .map(campus => {
      worstCampusElement.innerHTML = createCampusInsert(campus)
    })
}

// best player
const getBestPlayer = users => users
  .slice(0, 1)
  .map(user => {
    bestPlayerElement.innerHTML = createBestPlayerInsert(user)
  })

// general ranking
const getGeneralRanking = users => {
  const bestToWorst = users.sort((a, b) => b.bestScore - a.bestScore)
  const allScoresArr = []

  for (let i = 0; i < bestToWorst.length; i++) {
    const user = bestToWorst[i]
    user.position = i + 1
    allScoresArr.push(createAllScoreRow(user))
  }

  allScoresElement.innerHTML = allScoresArr.join('')
}

// start
getAllScores()
  .then(users => {
    getGeneralRanking(users)
    getBestPlayer(users)
    showCampusRanking(users)
    getBestCampus(users)
    getWorstCampus(users)
  })

getUser().then(user => {
  console.log(user)

  if (!user.username) {
    window.location = '/sign-in.html'
  }
})
