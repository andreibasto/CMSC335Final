const express = require('express');
const router = express.Router();

// Main page
router.get('/', (req, res) => res.render('index'));
router.get('/join', (req, res) => res.render('join'));
router.get('/filmography', (req, res) => res.render('filmography'));
router.get('/some-like-it-hot', (req, res) => res.render('some'));
router.get('/the-apartment', (req, res) => res.render('apartment'));
router.get('/ace-in-the-hole', (req, res) => res.render('ace'));
router.get('/the-lost-weekend', (req, res) => res.render('weekend'));
router.get('/sunset-boulevard', (req, res) => res.render('sunset'));

module.exports = router;