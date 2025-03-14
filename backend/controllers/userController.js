import asyncHandler from 'express-async-handler';
import generateToken from '../utils/generateToken.js';
import User from '../models/userModel.js'

// @desc Auth user/set token
// route POST /api/users/auth
// @access Public
const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPasswords(password))) {
        generateToken(res, user._id);
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc Register user
// route POST /api/users
// @access Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists')
    };

    const user = await User.create({
        name,
        email,
        password
    });

    if (user) {
        generateToken(res, user._id);
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data')
    }
});

// @desc Logout user
// route POST /api/users/logout
// @access Public
const logoutUser = asyncHandler(async (req, res) => {

    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0),
    });

    res.status(200).json({ message: 'Logout User' })
});

// @desc Get user profile
// route GET /api/users/profile
// @access Private
const getUserProfile = asyncHandler(async (req, res) => {

    const user = {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        isAdmin: req.user.isAdmin
    }

    res.status(200).json(user)
});

// @desc Update user profile
// route PUT /api/users/profile
// @access Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;

        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        res.status(200).json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    };
});


// @desc Delete user profile
// route DELETE /api/users/:id
// @access Private
const deleteUserProfile = asyncHandler(async (req, res) => {
    // Ensure the request comes from an authenticated admin
    const adminUser = await User.findById(req.user);

    if (!adminUser || !adminUser.isAdmin) {
        res.status(403);
        throw new Error("Not authorized as an admin");
    }
    console.log(adminUser)
    const user = await User.findById(req.params.id);

    if (!user) {
        res.status(400);
        throw new Error('User not found');
    }

    // Prevent an admin from deleting themselves
    if (req.user._id.toString() === user._id.toString()) {
        res.status(400);
        throw new Error("Admin cannot delete their own account");
    }

    await user.deleteOne();
    res.status(200).json({ id: req.params.id });
});

// @desc Get all user
// route GET /api/users
// @access Private
const getAllUser = asyncHandler(async (req, res) => {

    // Ensure the request comes from an authenticated admin
    const adminUser = await User.findById(req.user);

    if (!adminUser || !adminUser.isAdmin) {
        res.status(403);
        throw new Error("Not authorized as an admin");
    }

    const users = await User.find();

    res.status(200).json(users)
});

export {
    authUser,
    registerUser,
    logoutUser,
    getUserProfile,
    updateUserProfile,
    deleteUserProfile,
    getAllUser
};