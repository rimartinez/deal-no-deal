import './style.css'
import { Game } from './game.js'

const app = document.querySelector('#app')
const game = new Game(app)
game.init()

