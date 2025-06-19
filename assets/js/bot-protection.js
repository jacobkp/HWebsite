// Simple SVG robot icons
const robotSVGs = {
    black: `<svg viewBox="0 0 24 24" fill="#333">
        <rect x="7" y="7" width="10" height="8" rx="1" fill="#333"/>
        <rect x="9" y="9" width="1.5" height="1.5" fill="white"/>
        <rect x="13.5" y="9" width="1.5" height="1.5" fill="white"/>
        <rect x="10.5" y="12" width="3" height="0.8" fill="white"/>
        <rect x="5" y="11" width="1.5" height="3" fill="#333"/>
        <rect x="17.5" y="11" width="1.5" height="3" fill="#333"/>
        <rect x="9.5" y="17" width="1.5" height="2" fill="#333"/>
        <rect x="13" y="17" width="1.5" height="2" fill="#333"/>
        <rect x="10" y="5" width="4" height="2" fill="#333"/>
    </svg>`,
    red: `<svg viewBox="0 0 24 24" fill="#e74c3c">
        <rect x="7" y="7" width="10" height="8" rx="1" fill="#e74c3c"/>
        <rect x="9" y="9" width="1.5" height="1.5" fill="white"/>
        <rect x="13.5" y="9" width="1.5" height="1.5" fill="white"/>
        <rect x="10.5" y="12" width="3" height="0.8" fill="white"/>
        <rect x="5" y="11" width="1.5" height="3" fill="#e74c3c"/>
        <rect x="17.5" y="11" width="1.5" height="3" fill="#e74c3c"/>
        <rect x="9.5" y="17" width="1.5" height="2" fill="#e74c3c"/>
        <rect x="13" y="17" width="1.5" height="2" fill="#e74c3c"/>
        <rect x="10" y="5" width="4" height="2" fill="#e74c3c"/>
        <circle cx="12" cy="3" r="1" fill="#ff6b6b"/>
        <rect x="11.5" y="1" width="1" height="2" fill="#ff6b6b"/>
    </svg>`,
    green: `<svg viewBox="0 0 24 24" fill="#27ae60">
        <rect x="7" y="7" width="10" height="8" rx="1" fill="#27ae60"/>
        <rect x="9" y="9" width="1.5" height="1.5" fill="white"/>
        <rect x="13.5" y="9" width="1.5" height="1.5" fill="white"/>
        <rect x="10.5" y="12" width="3" height="0.8" fill="white"/>
        <rect x="5" y="11" width="1.5" height="3" fill="#27ae60"/>
        <rect x="17.5" y="11" width="1.5" height="3" fill="#27ae60"/>
        <rect x="9.5" y="17" width="1.5" height="2" fill="#27ae60"/>
        <rect x="13" y="17" width="1.5" height="2" fill="#27ae60"/>
        <rect x="10" y="5" width="4" height="2" fill="#27ae60"/>
        <path d="M10 3 L12 1 L14 3 Z" fill="#2ecc71"/>
    </svg>`
};

class BotProtectionDemo {
    constructor() {
        this.activeBots = [];
        this.maxVisibleBots = 50; // Increased for 10 bots per row
        this.overloadThreshold = Math.floor(this.maxVisibleBots * 0.8); // 80%
        this.isProtected = false;
        this.spawnRate = 100; // Set to maximum intensity from start
        this.isOverloaded = false;
        this.spawnInterval = null;
        
        this.initializeElements();
        this.startDemo();
    }

    initializeElements() {
        this.botStream = document.getElementById('botStream');
        this.browserContainer = document.getElementById('browserContainer');
        this.activateBtn = document.getElementById('activateBtn');
        this.countdownText = document.getElementById('countdownText');
        this.browserContent = this.browserContainer.querySelector('.browser-content');
        
        this.activateBtn.addEventListener('click', () => this.activateProtection());
    }

    getRandomBotType() {
        const rand = Math.random();
        if (rand < 0.6) return 'black';      // 60% black bots
        else if (rand < 0.8) return 'red';   // 20% red bots  
        else return 'green';                 // 20% green bots
    }

    createMovingBot(type) {
        const bot = document.createElement('div');
        bot.className = `bot ${type} moving`;
        bot.innerHTML = robotSVGs[type];
        
        // Random vertical position along the stream
        const randomOffset = (Math.random() - 0.5) * 80; // ±40px from center
        bot.style.top = `calc(50% + ${randomOffset}px)`;
        bot.style.left = '-30px';
        
        return bot;
    }

    spawnBot() {
        const type = this.getRandomBotType();
        
        // Always create the moving bot for visual continuity
        const movingBot = this.createMovingBot(type);
        this.botStream.appendChild(movingBot);
        
        // Check protection status at spawn time AND when animation completes
        const wasProtectedAtSpawn = this.isProtected;
        
        setTimeout(() => {
            // Double-check protection status when bot reaches browser
            if (this.isProtected && (type === 'black' || type === 'red')) {
                // Bot should be rejected - either was protected at spawn or became protected while moving
                this.showRejectedBot(type);
            } else {
                // Bot can enter browser
                this.moveBotToBrowser(type);
            }
            
            // Clean up moving bot
            if (movingBot.parentNode === this.botStream) {
                this.botStream.removeChild(movingBot);
            }
        }, 2500);
    }

    showRejectedBot(type) {
        const bot = document.createElement('div');
        bot.className = `bot ${type} rejected`;
        bot.innerHTML = robotSVGs[type];
        bot.style.top = `calc(50% + ${(Math.random() - 0.5) * 80}px)`;
        bot.style.left = 'calc(100% - 400px)';
        this.botStream.appendChild(bot);
        
        setTimeout(() => {
            if (bot.parentNode) {
                bot.parentNode.removeChild(bot);
            }
        }, 800);
    }

    moveBotToBrowser(type) {
        // Don't add if we're at capacity and it's not green
        if (this.activeBots.length >= this.maxVisibleBots && type !== 'green') {
            return;
        }

        const browserBot = document.createElement('div');
        browserBot.className = `bot ${type}`;
        browserBot.innerHTML = robotSVGs[type];
        browserBot.style.position = 'absolute';
        browserBot.style.width = '20px';
        browserBot.style.height = '20px';
        
        // Responsive bot positioning based on screen size
        const isTablet = window.innerWidth <= 768;
        const isMobile = window.innerWidth <= 480;
        
        let botsPerRow, botSpacing, startOffset;
        
        if (isMobile) {
            botsPerRow = 6;  // Fewer bots per row on mobile
            botSpacing = 18; // Tighter spacing
            startOffset = 8;
        } else if (isTablet) {
            botsPerRow = 8;  // Medium for tablets
            botSpacing = 20;
            startOffset = 8;
        } else {
            botsPerRow = 10; // Full desktop
            botSpacing = 25;
            startOffset = 10;
        }
        
        const gridX = (this.activeBots.length % botsPerRow) * botSpacing + startOffset;
        const gridY = Math.floor(this.activeBots.length / botsPerRow) * 18 + 30;
        
        browserBot.style.left = gridX + 'px';
        browserBot.style.top = gridY + 'px';
        
        this.browserContent.appendChild(browserBot);
        this.activeBots.push({ element: browserBot, type: type });

        this.checkOverloadStatus();
        this.manageBotOverflow();
    }

    checkOverloadStatus() {
        const wasOverloaded = this.isOverloaded;
        this.isOverloaded = this.activeBots.length >= this.overloadThreshold && !this.isProtected;
        
        if (this.isOverloaded && !wasOverloaded) {
            this.browserContainer.classList.add('overloaded');
        } else if (!this.isOverloaded && wasOverloaded) {
            this.browserContainer.classList.remove('overloaded');
        }
    }

    manageBotOverflow() {
        // Smooth pagination: remove bottom row when overflow
        if (this.activeBots.length > this.maxVisibleBots) {
            const botsToRemove = this.activeBots.length - this.maxVisibleBots;
            
            for (let i = 0; i < botsToRemove; i++) {
                if (this.activeBots.length > 0) {
                    const botToRemove = this.activeBots.shift();
                    botToRemove.element.classList.add('removing');
                    
                    // Remove after animation
                    setTimeout(() => {
                        if (botToRemove.element.parentNode) {
                            botToRemove.element.parentNode.removeChild(botToRemove.element);
                        }
                    }, 500);
                }
            }
            
            // Reposition remaining bots
            setTimeout(() => {
                this.repositionBots();
            }, 250);
        }
    }

    repositionBots() {
        // Responsive positioning
        const isTablet = window.innerWidth <= 768;
        const isMobile = window.innerWidth <= 480;
        
        let botsPerRow, botSpacing, startOffset;
        
        if (isMobile) {
            botsPerRow = 6;
            botSpacing = 18;
            startOffset = 8;
        } else if (isTablet) {
            botsPerRow = 8;
            botSpacing = 20;
            startOffset = 8;
        } else {
            botsPerRow = 10;
            botSpacing = 25;
            startOffset = 10;
        }
        
        this.activeBots.forEach((bot, index) => {
            const gridX = (index % botsPerRow) * botSpacing + startOffset;
            const gridY = Math.floor(index / botsPerRow) * 18 + 30;
            
            bot.element.style.transition = 'all 0.3s ease';
            bot.element.style.left = gridX + 'px';
            bot.element.style.top = gridY + 'px';
        });
    }

    activateProtection() {
        if (this.isProtected) return;
        
        this.isProtected = true;
        this.browserContainer.classList.add('protected');
        this.browserContainer.classList.remove('overloaded');
        this.activateBtn.classList.add('activated');
        
        // Purge all non-green bots
        this.purgeNonGreenBots();
        
        // Start countdown immediately (skip intermediate PROTECTED state)
        let countdown = 5; // Changed back to 5 seconds
        this.activateBtn.innerHTML = `
            <div style="font-weight: 600; font-size: 1rem;">PROTECTED. VIEW PRODUCT NOW</div>
            <div style="font-weight: 400; font-size: 0.9rem; margin-top: 2px;">REDIRECTING IN ${countdown} SECONDS</div>
        `;
        
        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                this.activateBtn.innerHTML = `
                    <div style="font-weight: 600; font-size: 1rem;">PROTECTED. VIEW PRODUCT NOW</div>
                    <div style="font-weight: 400; font-size: 0.9rem; margin-top: 2px;">REDIRECTING IN ${countdown} SECONDS</div>
                `;
            } else {
                clearInterval(countdownInterval);
                window.location.href = 'https://poc.iamheimdall.com';
            }
        }, 1000);
    }

    purgeNonGreenBots() {
        const botsToRemove = this.activeBots.filter(bot => bot.type !== 'green');
        
        botsToRemove.forEach(bot => {
            bot.element.classList.add('removing');
            const index = this.activeBots.indexOf(bot);
            if (index > -1) {
                this.activeBots.splice(index, 1);
            }
            
            setTimeout(() => {
                if (bot.element.parentNode) {
                    bot.element.parentNode.removeChild(bot.element);
                }
            }, 500);
        });
        
        // Reposition remaining green bots
        setTimeout(() => {
            this.repositionBots();
            this.checkOverloadStatus();
        }, 250);
    }

    startDemo() {
        // Simple, steady spawn rate at maximum intensity
        this.spawnInterval = setInterval(() => {
            this.spawnBot();
        }, this.spawnRate); // 100ms = very fast, steady rate
    }
}

// Initialize the demo when page loads
document.addEventListener('DOMContentLoaded', () => {
    new BotProtectionDemo();
});