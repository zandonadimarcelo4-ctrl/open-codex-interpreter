import time
import random
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Setup the webdriver (Chrome)
try:
    driver = webdriver.Chrome()
    print("Chrome driver initialized successfully")
except Exception as e:
    print(f"Error initializing Chrome driver: {e}")
    exit(1)

# Open Clique Jogos website
try:
    driver.get("https://www.cliquejogos.com.br/")
    print("Clique Jogos website opened successfully")
    time.sleep(3)
except Exception as e:
    print(f"Error opening website: {e}")
    driver.quit()
    exit(1)

# Try to find and click on a random game
try:
    # Wait for games to load
    wait = WebDriverWait(driver, 10)
    
    # Find game elements (this might need adjustment based on actual website structure)
    game_elements = driver.find_elements(By.CSS_SELECTOR, "a[href*='/jogo/']")
    
    if game_elements:
        # Select a random game
        random_game = random.choice(game_elements)
        print(f"Selected game: {random_game.get_attribute('title')}")
        
        # Click on the random game
        random_game.click()
        print("Game opened successfully")
        
        # Wait a bit to see the result
        time.sleep(5)
    else:
        print("No games found on the page")
        
except Exception as e:
    print(f"Error selecting random game: {e}")

# Close the browser
try:
    driver.quit()
    print("Browser closed successfully")
except Exception as e:
    print(f"Error closing browser: {e}")

print("Script execution completed.")