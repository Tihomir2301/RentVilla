const mongoose = require('mongoose');
const Review = require('./review')
const Schema = mongoose.Schema;

const VillaSchema = new Schema({
    title: String,
    images: [
        {
            url: String, 
            filename: String
        }
    ],
    price: Number,
    description: String,
    location: String,
    rooms: Number, 
    people: Number,
    author: {
        type: Schema.Types.ObjectId, 
        ref: 'User'
    },
    reviews:[
        {
            type: Schema.Types.ObjectId, 
            ref: 'Review'
        }
    ]
    
});

VillaSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await Review.deleteMany({
            _id: {
                $in: doc.reviews
            }
        })
    }
})


module.exports = mongoose.model('Villa', VillaSchema);