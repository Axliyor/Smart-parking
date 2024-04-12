const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
const port = 3000;
let cars;
let cams;
let barriers;
// Middleware to parse JSON data
app.use(express.json());

const dataFilePath = 'data/cars.json';
const camDataFilePath = 'data/cams.json';
const barrierDataFilePath = 'data/barriers.json';
function getCarsFromFile() {
  try {
    const data = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}
function getCamsFromFile() {
  try {
    const data = fs.readFileSync(camDataFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}
function getBarriersFromFile() {
  try {
    const data = fs.readFileSync(barrierDataFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function saveCarsToFile(cars) {
  fs.writeFileSync(dataFilePath, JSON.stringify(cars, null, 2), 'utf8');
}
function saveCamsToFile(cams) {
  fs.writeFileSync(camDataFilePath, JSON.stringify(cams, null, 2), 'utf8');
}
function saveBarriersToFile(barriers) {
  fs.writeFileSync(barrierDataFilePath, JSON.stringify(barriers, null, 2), 'utf8');
}
function saveBarriersToFile(barriers) {
  fs.writeFileSync(barrierDataFilePath, JSON.stringify(barriers, null, 2), 'utf8');
}
app.get('/cars', (req, res) => {
  res.render('cars', { cars });
});

app.get('/cams', (req, res) => {
  res.render('cams', { cams });
});
app.get('/barriers', (req, res) => {
  res.render('barriers', { barriers });
});
app.get('/all_barriers', (req, res) => {
  res.status(200).json(barriers);
});
app.get('/all_cams', (req, res) => {
  res.status(200).json(cams);
});

app.get('/home', (req, res) => {
  res.render('home', { cams });
});
app.get('/', (req, res) => {
  res.render('home', { cams });
})
app.get('/logs', (req, res) => {
  const options = {
    root: path.join('./data/')
  };
  res.sendFile('logs.txt', options, function (err) {
    if (err) {
        console.error('Error sending file:', err);
    }
  });
});
app.get('/check', (req, res) => {
  const { number } = req.query;
  let foundItems = cars.filter(item => item.car_number.includes(number.toString()));
  console.log(foundItems)
  if (foundItems.length > 0) {
    const dateTimeObject = new Date();
    let hours = dateTimeObject.getHours();
    let minutes = dateTimeObject.getMinutes();
    let seconds = dateTimeObject.getSeconds();
    fs.appendFile('./data/logs.txt', foundItems[0].car_number+" "+dateTimeObject.toDateString()+" "+hours+":"+minutes+":"+seconds+"\n", (err) => {
      if (err) {
        console.error('Error appending to the file:', err);
        throw err;
      }
      // console.log('Data appended to the file successfully.');
    });
    return res.status(200).json(foundItems[0]);
  } else {
    return res.status(404).json({ error: 'car not found' });
  }
});

// GET /cars/:id - Get details of a specific car
app.get('/cars/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const car = cars.find(car => car.id === id);
  if (!car) {
    return res.status(404).json({ error: 'car not found' });
  }
  res.json(car);
});

// POST /cars - Create a new car
app.post('/cars', (req, res) => {
  const { user, car_number } = req.body;
  console.log(req.body)
  const carExists = cars.some(car => car.car_number === car_number);

  if (carExists) {
    // Car with the specified car_number exists
    return res.status(404).json({ error: 'Car allready registered!' });
  } else {
    // Car with the specified car_number does not exist
    const id = cars.length > 0 ? cars[cars.length - 1].id + 1 : 1;
    const newcar = { id, user, car_number };
    cars.push(newcar);
    saveCarsToFile(cars);
    res.render('cars', { cars });
  }
});

app.post('/cams', (req, res) => {
  const { address } = req.body;
  const camExists = cams.some(cam => cam.address === address);

  if (camExists) {
    return res.status(404).json({ error: 'Address allready registered!' });
  } else {
    const id = cams.length > 0 ? cams[cams.length - 1].id + 1 : 1;
    const newcam = { id, address };
    cams.push(newcam);
    saveCamsToFile(cams);
    res.render('cams', { cams });
  }
});

app.post('/barriers', (req, res) => {
  const { address, description } = req.body;
  const barrierExists = barriers.some(barrier => barrier.address === address);

  if (barrierExists) {
    return res.status(404).json({ error: 'Address allready registered!' });
  } else {
    const id = barriers.length > 0 ? barriers[barriers.length - 1].id + 1 : 1;
    const newbarrier = { id, address, description };
    barriers.push(newbarrier);
    saveBarriersToFile(barriers);
    res.render('barriers', { barriers });
  }
});

app.post('/change/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { user, car_number } = req.body;
  const car = cars.find(car => car.id === id);

  if (!car) {
    return res.status(404).json({ error: 'Car not found' });
  }
  car.user = user;
  car.car_number = car_number;
  saveCarsToFile(cars);
  res.render('cars', { cars });
});
app.put('/cams/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { address } = req.body;
  const cam = cams.find(cam => cam.id === id);

  if (!cam) {
    return res.status(404).json({ error: 'Cam not found' });
  }
  cam.address = address;
  saveCamsToFile(cams);
  res.json(cam);
  console.log(cams)
});
app.post('/change_cam/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { address } = req.body;
  const cam = cams.find(cam => cam.id === id);

  if (!cam) {
    return res.status(404).json({ error: 'Cam not found' });
  }
  cam.address = address;
  saveCamsToFile(cams);
  res.render('cams', { cams });
});
app.post('/change_barrier/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { address, description } = req.body;
  const barrier = barriers.find(barrier => barrier.id === id);

  if (!barrier) {
    return res.status(404).json({ error: 'Barrier not found' });
  }
  barrier.address = address;
  barrier.description = description;
  saveBarriersToFile(barriers);
  res.render('barriers', { barriers });
});

app.delete('/cars/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const carIndex = cars.findIndex(car => car.id === id);

  if (carIndex === -1) {
    return res.status(404).json({ error: 'car not found' });
  }

  const deletedcars = cars.splice(carIndex, 1);
  saveCarsToFile(cars);
  res.json(deletedcars[0]);
});

app.post('/delete/:id', (req, res) => {
  const id = parseInt(req.params.id);

  const carIndex = cars.findIndex(car => car.id === id);

  if (carIndex === -1) {
    return res.status(404).json({ error: 'car not found' });
  }

  const deletedcars = cars.splice(carIndex, 1);
  saveCarsToFile(cars);
  res.render('cars', { cars });
});

app.post('/delete_cam/:id', (req, res) => {
  const id = parseInt(req.params.id);

  const camIndex = cams.findIndex(cam => cam.id === id);

  if (camIndex === -1) {
    return res.status(404).json({ error: 'cam not found' });
  }

  const deletedcams = cams.splice(camIndex, 1);
  saveCamsToFile(cams);
  res.render('cams', { cams });
});
app.post('/delete_barrier/:id', (req, res) => {
  const id = parseInt(req.params.id);

  const barrierIndex = barriers.findIndex(barrier => barrier.id === id);

  if (barrierIndex === -1) {
    return res.status(404).json({ error: 'cam not found' });
  }

  const deletedcams = barriers.splice(barrierIndex, 1);
  saveCamsToFile(barriers);
  res.render('cams', { barriers });
});
app.listen(port, () => {
  cars = getCarsFromFile();
  cams = getCamsFromFile();
  barriers = getBarriersFromFile();
  console.log(`Server running on http://localhost:${port}`);
});

