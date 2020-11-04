const router = require('express').Router();
const Drivein = require('../models/drivein');
const Movie = require('../models/movie');

const isAuthenticated = (req, res, next) => {
  if (req.session.currentUser) {
    return next()
  } else {
    res.redirect('/sessions/new')
  }
}

router.get('/', async (req, res) => {
  console.log('Index Route');
  console.log(req.body);

  let allDriveins = await Drivein.find({});
  res.render('driveins/index.ejs', { 
    driveins: allDriveins,
    currentUser: req.session.currentUser 
  });
});

router.get('/new', isAuthenticated, async (req, res) => {
  let allMovies = await Movie.find({});
  res.render('driveins/new.ejs', { 
    movies: allMovies,
    currentUser: req.session.currentUser
   });
});


router.get('/:driveinId/edit', isAuthenticated, (req, res) => {
  // set the value of the user and tweet ids
  const driveinId = req.params.driveinId;
  // find user in db by id
  Drivein.findById(driveinId, (err, foundDrivein) => {
    res.render('driveins/edit.ejs', { 
      foundDrivein,
      currentUser: req.session.currentUser
    });
  });
});


router.get('/:id', async (req, res) => {
  // initMap(36.17, 115.14);
  let allMovies = await Movie.find({});
  let foundDrivein = await Drivein.findById(req.params.id).populate({
    path: 'movies',
    currentUser: req.session.currentUser
   });

  res.render('driveins/show.ejs', {
    drivein: foundDrivein,
    movies: allMovies,
    currentUser: req.session.currentUser
  });
});


router.post('/', isAuthenticated, async (req, res) => {
  console.log(req.body);
  let drivein = new Drivein();
  drivein.name = req.body.name;
  drivein.address = req.body.address;

  if (!Array.isArray(req.body.movies)) {
    let temp = req.body.movies;
    req.body.movies = [];
    req.body.movies.push(temp);
  }

  req.body.movies.forEach ((movie, index) => {
    Object.keys(req.body).forEach (key => {
      if (movie === key) {
        console.log(index, req.body[key]);
        drivein.movies.push(movie);
        let showtime = {movieshowtimes: []};
        if (Array.isArray(req.body[key])) {
          for (i=0; i<req.body[key].length; i++) {
            showtime.movieshowtimes.push(req.body[key][i]);
          }
        }
        else {
          showtime.movieshowtimes.push(req.body[key]);
        }
        drivein.showtimes.push(showtime);
      }
    });
  });

  await drivein.save();
  res.redirect(`/driveins/${drivein.id}`);
});


router.put('/:driveinId/editName', isAuthenticated, (req, res) => {
  console.log('PUT ROUTE');
  // set the value of the Drivein id
  const driveinId = req.params.driveinId;
  // find movie in db by id
  Drivein.findById(driveinId, (err, foundDrivein) => {
    foundDrivein.name = req.body.name;
    foundDrivein.address = req.body.address;
    foundDrivein.save((err, savedDrivein) => {
      res.redirect(`/driveins/${foundDrivein.id}`);
    });
  });
});


router.put('/:driveinId/edit', isAuthenticated, async (req, res) => {
  console.log(req.body);

  if (!Array.isArray(req.body.movies)) {
    let temp = req.body.movies;
    req.body.movies = [];
    req.body.movies.push(temp);
  }

  let drivein = new Drivein();
  let callSucceededFlag = false;

  // await Drivein.findById(req.params.driveinId, async (err, foundDrivein) => {
  //   console.log(`foundDrivein is ${foundDrivein}`);
  //   callSucceededFlag = true;

  //   for (let i=0; i<foundDrivein.movies.length; i++) {
  //     drivein.movies.push(foundDrivein.movies[i]);
  //     drivein.showtimes.push(foundDrivein.showtimes[i]);
  //   }
  // });

  let foundDrivein = await Drivein.findById(req.params.driveinId);
  
  console.log(`foundDrivein is ${foundDrivein}`);
  callSucceededFlag = true;

  for (let i=0; i<foundDrivein.movies.length; i++) {
        drivein.movies.push(foundDrivein.movies[i]);
        drivein.showtimes.push(foundDrivein.showtimes[i]);
  }

  console.log(`1 drivein movies length is: ${drivein.movies.length}`);
  console.log(`callSucceededFlag is: ${callSucceededFlag}`);

  // Check if DB findById call returned callback
  if (callSucceededFlag) {
    req.body.movies.forEach ((movie, index) => {

      Object.keys(req.body).forEach (key => {
        if (movie === key) {
          console.log(index, req.body[key]);
          drivein.movies.push(movie);
          let showtime = {movieshowtimes: []};
          if (Array.isArray(req.body[key])) {
            for (i=0; i<req.body[key].length; i++) {
              showtime.movieshowtimes.push(req.body[key][i]);
            } 
          }
          else {
            showtime.movieshowtimes.push(req.body[key]);
          }
          drivein.showtimes.push(showtime);
        }
      });
    });

    console.log(`2 drivein movies length is: ${drivein.movies.length}`);

    let duplicateFlag = true;
    while (duplicateFlag) {
      duplicateFlag = false;
      for (let i=0; i<drivein.movies.length; i++) {
        for (let j=i; j<drivein.movies.length; j++) {
          if (i != j) {
            if (String(drivein.movies[i]) == String(drivein.movies[j])) {
              drivein.movies.splice(i, 1);
              drivein.showtimes.splice(i, 1);
              duplicateFlag = true;
            }
          }
        }
      }
    }

    console.log(`3 drivein movies length is: ${drivein.movies.length}`);

    await Drivein.findByIdAndUpdate(
      req.params.driveinId,
      {
        $set: {
          movies: drivein.movies,
        },
      },
      { new: true, upsert: false }
    );

    await Drivein.findByIdAndUpdate(
      req.params.driveinId,
      {
        $set: {
          showtimes: drivein.showtimes,
        },
      },
      { new: true, upsert: false }
    );
  }

  res.redirect(`/driveins/${req.params.driveinId}`);
});


router.delete('/:driveinId/movies/:movieId', isAuthenticated, (req, res) => {
  console.log('DELETE MOVIE');

  const driveinId = req.params.driveinId;
  const movieId = req.params.movieId;

  Drivein.findById(driveinId, (err, foundDrivein) => {
    let index = 0;

    for (let i=0; i<foundDrivein.movies.length; i++) {
      if (String(foundDrivein.movies[i]) == String(movieId)) {
        index = i;
      }
    }

    foundDrivein.movies.splice(index, 1);
    foundDrivein.showtimes.splice(index, 1);

    foundDrivein.save((err, savedDrivein) => {
      res.redirect(`/driveins/${foundDrivein.id}`);
    });
  });
});


// DELETE
router.delete('/:id', isAuthenticated, (req, res) => {
  Drivein.findByIdAndRemove(req.params.id, (err, deletedFruit) => {
    res.redirect('/driveins');
  })
});

module.exports = router;
