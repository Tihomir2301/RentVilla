const mongoose = require('mongoose');
const cities = require('./cities');
const { places, descriptors } = require('./seedNames');
const Villa = require('../models/villas');

mongoose.connect('mongodb://localhost:27017/rent-villa');

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const sample = array => array[Math.floor(Math.random() * array.length)];


const seedDB = async () => {
    await Villa.deleteMany({});
    for (let i = 0; i < 50; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 401) + 100;
        const people = Math.floor(Math.random() * 14) + 2;
        const rooms = Math.round(people / 2); 



        const villa = new Villa({
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            image: 'https://source.unsplash.com/featured/?villa',
            description: 'Escape to a luxurious villa nestled in the heart of paradise. This enchanting retreat offers breathtaking views of the pristine landscape, where lush gardens and azure skies create a tranquil haven. Immerse yourself in the elegance of modern design and opulent furnishings, seamlessly blending with the natural beauty that surrounds. ',
            price: price, 
            people: people,
            rooms: rooms, 

        })
        await villa.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close();
})