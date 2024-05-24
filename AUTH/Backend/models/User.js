const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    firstname: {
        type: String,
        default: null,
        required: true,
    },
    lastname: {
        type: String,
        default: null,
        required: true,
    },
    email: {
        type: String,
        default: null,
        required: true,
        unique: true,
        validate: {
            validator: function (v) {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              return emailRegex.test(v);
            },
            message: props => `${props.value} is not a valid email address!`
          }
    },
    password: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                // Password should have at least 8 characters, with at least one uppercase letter, one lowercase letter, one number, and one special character
                return /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/.test(v);
            },
            message: props => `${props.value} is not a valid password! Password should have at least 8 characters, with at least one uppercase letter, one lowercase letter, one number, and one special character.`
        }
    }

});

module.exports = mongoose.model("user", userSchema) 