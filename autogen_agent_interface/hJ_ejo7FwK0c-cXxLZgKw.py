import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options

# Set up Chrome options
chrome_options = Options()
chrome_options.add_argument("--start-maximized")

# Initialize the driver
try:
    driver = webdriver.Chrome(options=chrome_options)
    print("Opening Pinterest...")
    
    # Open Pinterest
    driver.get("https://www.pinterest.com")
    
    # Wait for page to load
    time.sleep(5)
    
    # Try to find and click on a pin to save
    try:
        # Look for a pin element (this will vary based on Pinterest's current layout)
        pin_elements = driver.find_elements(By.CSS_SELECTOR, "[data-test-id='pin-image']")
        
        if pin_elements:
            # Click on the first pin
            pin_elements[0].click()
            print("Clicked on a pin")
            
            # Wait for pin details to load
            time.sleep(3)
            
            # Try to find save button
            save_button = driver.find_element(By.CSS_SELECTOR, "[data-test-id='save-button']")
            
            if save_button:
                save_button.click()
                print("Pin saved successfully!")
            else:
                print("Save button not found")
        else:
            print("No pins found on the page")
            
    except Exception as e:
        print(f"Error interacting with pin: {e}")
        
    # Wait a bit before closing
    time.sleep(5)
    
except Exception as e:
    print(f"Error opening Pinterest: {e}")
finally:
    # Close the driver
    try:
        driver.quit()
        print("Browser closed")
    except:
        pass

print("Script execution completed.")