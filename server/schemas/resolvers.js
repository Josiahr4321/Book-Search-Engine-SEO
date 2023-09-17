// Import necessary modules and functions
const { User } = require('../models');
const { signToken } = require('../utils/auth');
const { AuthenticationError } = require('apollo-server-express');

// Define resolvers for GraphQL queries and mutations
const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      // Check if there's a user in the context (i.e., if the user is logged in)
      if (context.user) {
        // Retrieve user data, excluding '__v' and 'password' fields
        const userData = User.findOne({ _id: context.user._id }).select('-__v -password');
        console.log(userData);
        return userData;
      }
      // If no user is found in the context, throw an AuthenticationError
      throw new AuthenticationError('You need to be logged in!');
    },
  },
  Mutation: {
    addUser: async (parent, { username, email, password }) => {
      // Create a new user
      const user = await User.create({ username, email, password });
      // Generate a token for the user
      const token = signToken(user);
      return { token, user };
    },
    login: async (parent, { email, password }) => {
      // Find a user by email
      const user = await User.findOne({ email });

      if (!user) {
        // If no user is found with the provided email, throw an AuthenticationError
        throw new AuthenticationError('No user found with this email address');
      }

      // Check if the provided password is correct
      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        // If the password is incorrect, throw an AuthenticationError
        throw new AuthenticationError('Incorrect credentials');
      }

      // If the email and password are correct, generate a token for the user
      const token = signToken(user);

      return { token, user };
    },
    saveBook: async (parent, { bookData }, context) => {
      // Add a book to the user's list of saved books
      const book = await User.findByIdAndUpdate(
        { _id: context.user._id },
        { $push: { savedBooks: bookData } },
        { new: true, runValidators: true }
      );
      return book;
    },
    removeBook: async (parent, { bookId }, context) => {
      // Check if there's a user in the context (i.e., if the user is logged in)
      if (context.user) {
        // Remove a book from the user's list of saved books
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: bookId } },
          { new: true }
        );

        return updatedUser;
      }
      // If no user is found in the context, throw an AuthenticationError
      throw new AuthenticationError('You need to be logged in!');
    },
  },
};

// Export the resolvers
module.exports = resolvers;
