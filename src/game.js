export class Game {
  constructor(container) {
    this.container = container
    this.boxes = Array(10).fill(null).map((_, i) => ({ id: i + 1, value: null, revealed: false, isContestantBox: false }))
    this.gameState = 'setup' // 'setup', 'playing', 'ended'
    this.contestantBox = null
    this.lastRevealedCount = 0 // Track the number of revealed boxes when buttons were last shown
    this.newlyRevealedIndex = null // Track which box was just revealed for animation
  }

  init() {
    this.render()
  }

  render() {
    this.container.innerHTML = `
      <div class="game-container">
        <h1>RR's Papasko!</h1>
        
        ${this.gameState === 'setup' ? this.renderSetup() : ''}
        ${this.gameState === 'playing' || this.gameState === 'ended' ? this.renderValuesTable() : ''}
        ${this.gameState === 'playing' ? this.renderPlaying() : ''}
        ${this.gameState === 'ended' ? this.renderEnded() : ''}
        
        <div class="boxes-grid">
          ${this.boxes.map((box, index) => `
            <div class="box ${box.revealed || this.gameState === 'ended' ? 'revealed' : ''} ${box.isContestantBox ? 'contestant-box' : ''}" 
                 data-index="${index}">
              <div class="box-number">${box.id}</div>
              ${box.revealed || this.gameState === 'ended' ? `<div class="box-value ${index === this.newlyRevealedIndex ? 'reveal-animation' : ''}">$${box.value?.toLocaleString() || '0'}</div>` : ''}
              ${box.isContestantBox ? '<div class="contestant-label">Your Box</div>' : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `

    this.attachEventListeners()
  }

  renderSetup() {
    return `
      <div class="setup-panel">
        <h2>Host: Set Box Values</h2>
        <div class="setup-controls">
          ${this.boxes.map((box, index) => `
            <div class="setup-item">
              <input type="number" 
                     class="value-input" 
                     data-index="${index}" 
                     placeholder="Enter value"
                     min="0"
                     step="1">
            </div>
          `).join('')}
        </div>
        <button class="btn btn-primary" id="start-game">Start Game</button>
      </div>
    `
  }

  renderValuesTable() {
    // Get all unique values from boxes
    const allValues = this.boxes
      .map(box => box.value)
      .filter(value => value !== null)
      .sort((a, b) => a - b)
    
    // Get revealed values
    const revealedValues = this.boxes
      .filter(box => box.revealed)
      .map(box => box.value)

    return `
      <div class="values-table-container">
        <table class="values-table">
          <tbody>
            ${allValues.map(value => {
              const isRevealed = revealedValues.includes(value)
              return `
                <tr class="${isRevealed ? 'revealed-value' : ''}">
                  <td>$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              `
            }).join('')}
          </tbody>
        </table>
      </div>
    `
  }

  renderPlaying() {
    const hasRevealedBoxes = this.boxes.some(box => box.revealed)
    const revealedCount = this.boxes.filter(box => box.revealed).length
    const offer = hasRevealedBoxes ? this.calculateOffer() : null
    // Show Deal/No Deal buttons after each box reveal, but only if a new box was just revealed
    const showDealButtons = this.contestantBox && revealedCount > 0 && revealedCount > this.lastRevealedCount && offer !== null
    
    // Only show panel if contestant has picked a box
    if (!this.contestantBox) {
      return ''
    }
    
    return `
      <div class="playing-panel">
        <div class="host-controls">
          ${offer !== null ? `
            <div class="offer-display">
              <p class="offer-label">Current Offer:</p>
              <p class="offer-amount">$${offer.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          ` : ''}
          <div class="deal-buttons" style="visibility: ${showDealButtons ? 'visible' : 'hidden'}">
            <button class="btn btn-deal" id="deal-btn">Deal</button>
            <button class="btn btn-no-deal" id="no-deal-btn">No Deal</button>
          </div>
        </div>
      </div>
    `
  }

  renderEnded() {
    const contestantBoxValue = this.boxes.find(box => box.isContestantBox)?.value || 0
    return `
      <div class="playing-panel">
        <h2>Game Ended</h2>
        <div class="final-result">
          <p class="info">Your box (Box ${this.contestantBox}) contained:</p>
          <p class="final-value">$${contestantBoxValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      </div>
    `
  }

  attachEventListeners() {
    if (this.gameState === 'setup') {
      const startBtn = document.getElementById('start-game')
      if (startBtn) {
        startBtn.addEventListener('click', () => this.startGame())
      }
    }

    if (this.gameState === 'playing') {
      // Attach click listeners to boxes
      document.querySelectorAll('.box').forEach(boxEl => {
        const index = parseInt(boxEl.dataset.index)
        const box = this.boxes[index]
        
        if (!this.contestantBox) {
          // If no contestant box selected, clicking any box selects it
          if (!box.revealed) {
            boxEl.addEventListener('click', () => this.pickContestantBox(index))
          }
        } else {
          // If contestant box is selected, clicking reveals other boxes
          if (!box.revealed && !box.isContestantBox) {
            boxEl.addEventListener('click', () => this.revealBox(index))
          }
        }
      })

      // Attach Deal/No Deal button listeners
      const dealBtn = document.getElementById('deal-btn')
      if (dealBtn) {
        dealBtn.addEventListener('click', () => this.acceptDeal())
      }

      const noDealBtn = document.getElementById('no-deal-btn')
      if (noDealBtn) {
        noDealBtn.addEventListener('click', () => this.rejectDeal())
      }
    }

  }

  startGame() {
    // Get all values from inputs
    const inputs = document.querySelectorAll('.value-input')
    const values = []
    let allFilled = true

    inputs.forEach((input) => {
      const value = parseFloat(input.value)
      if (isNaN(value) || value < 0) {
        allFilled = false
      } else {
        values.push(value)
      }
    })

    if (!allFilled) {
      alert('Please fill in all box values with valid numbers (0 or greater)')
      return
    }

    // Randomize the values and assign them to boxes
    this.randomizeValues(values)

    this.gameState = 'playing'
    this.render()
  }

  randomizeValues(values) {
    // Shuffle the values array using Fisher-Yates algorithm
    const shuffled = [...values]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    // Assign shuffled values to boxes
    shuffled.forEach((value, index) => {
      this.boxes[index].value = value
    })
  }

  pickContestantBox(index) {
    if (this.boxes[index].revealed) {
      return
    }

    this.boxes[index].isContestantBox = true
    this.contestantBox = this.boxes[index].id
    this.render()
  }

  revealBox(index) {
    if (this.boxes[index].revealed || this.boxes[index].isContestantBox || this.gameState === 'ended') {
      return
    }

    // Mark box as revealed
    this.boxes[index].revealed = true
    // Track this as newly revealed for animation
    this.newlyRevealedIndex = index
    // Update last revealed count to show buttons after this reveal
    const newRevealedCount = this.boxes.filter(box => box.revealed).length
    this.lastRevealedCount = newRevealedCount - 1 // Set to previous count so buttons will show
    
    // Check if only the contestant's box remains
    const unopenedBoxes = this.boxes.filter(box => !box.revealed)
    if (unopenedBoxes.length === 1 && unopenedBoxes[0].isContestantBox) {
      // Game ends - reveal contestant's box and end game
      setTimeout(() => {
        this.gameState = 'ended'
        // Reveal all boxes including contestant's
        this.boxes.forEach(box => {
          box.revealed = true
        })
        this.render()
      }, 3000) // Wait for animation to complete
    }
    
    // Render with animation
    this.render()
    
    // Clear the newly revealed index after animation completes
    setTimeout(() => {
      this.newlyRevealedIndex = null
    }, 3000)
  }

  acceptDeal() {
    this.gameState = 'ended'
    // Reveal all boxes
    this.boxes.forEach(box => {
      box.revealed = true
    })
    this.render()
  }

  rejectDeal() {
    // Continue the game - hide buttons until next box is revealed
    const currentRevealedCount = this.boxes.filter(box => box.revealed).length
    this.lastRevealedCount = currentRevealedCount // Update to current count to hide buttons
    this.render()
  }

  calculateOffer() {
    if (!this.contestantBox) {
      return null
    }

    // Get all unopened boxes (including contestant's box)
    const unopenedBoxes = this.boxes.filter(box => !box.revealed)
    
    // Don't show offer if only 1 box is left (the contestant's box)
    if (unopenedBoxes.length <= 1) {
      return null
    }

    // Calculate the average (mid value) of unopened boxes
    const sum = unopenedBoxes.reduce((total, box) => total + (box.value || 0), 0)
    const average = sum / unopenedBoxes.length

    // Round down to the nearest 50
    return Math.floor(average / 50) * 50
  }

  resetGame() {
    this.boxes = Array(10).fill(null).map((_, i) => ({ id: i + 1, value: null, revealed: false, isContestantBox: false }))
    this.gameState = 'setup'
    this.contestantBox = null
    this.lastRevealedCount = 0
    this.newlyRevealedIndex = null
    this.render()
  }
}

