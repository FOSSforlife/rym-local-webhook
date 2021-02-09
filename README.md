# RYM Local Webhook

RateYourMusic is super stringent about scripts that fetch its data for scraping, even when I attempted to use a proxy. So instead, I've wrote a script that runs on my laptop and waits for me to save the chart page using my browser, then auto-posts the top albums to my Discord server. It only posts an update if the chart has updated (it checks the date on the page).
