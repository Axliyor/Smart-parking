import cv2
import imutils
import numpy as np
import pytesseract
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
from time import time
from time import sleep
import threading
import random
import requests
import json
threads = []
endpoint = 'localhost:3000'
barrier = 'localhost:5000'
counter = 0
wait = 0
def getCamAddress():
    global endpoint
    url = "http://"+endpoint+"/all_cams"
    response = requests.get(url)
    if response.status_code == 200:
        return response.text
    else:
        return "error"
def getBarrierAddress():
    global endpoint
    url = "http://"+endpoint+"/all_barriers"
    response = requests.get(url)
    if response.status_code == 200:
        return response.text
    else:
        return "error"

def sendDataToServer(data):
    global space
    global endpoint
    global barrier
    url = "http://"+endpoint+"/check?number=" + data  # Replace with the desired URL
    response = requests.get(url)
    if response.status_code == 200:
        space = round(time()*1000) + 2000
        print(response.content)
        try:
            print("door opening...")
            # requests.get(barrier)
        except:
            print("door not found!")
    else:
        print("car not found!")
def recognize(img):
    global space
    if space > round(time()*1000):
        return
    sleep(0.1)
    if space > round(time()*1000):
        return
    global counter
    time_start = round(time()*1000)
    frame = img[350:750, 600:1200] #img[y:y+h, x:x+w] 1280x720
    img = frame
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.bilateralFilter(gray, 13, 15, 15)

    edged = cv2.Canny(gray, 30, 200)
    contours = cv2.findContours(edged.copy(), cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    contours = imutils.grab_contours(contours)
    contours = sorted(contours, key = cv2.contourArea, reverse = True)[:10]
    screenCnt = None

    for c in contours:
        
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.018 * peri, True)
    
        if len(approx) == 4:
            screenCnt = approx
            break

    if screenCnt is None:
        detected = 0
        return
    else:
        detected = 1

    if detected != 1:
        return
    
    mask = np.zeros(gray.shape,np.uint8)
    cv2.drawContours(mask,[screenCnt],0,255,-1,)

    (x, y) = np.where(mask == 255)
    (topx, topy) = (np.min(x), np.min(y))
    (bottomx, bottomy) = (np.max(x), np.max(y))
    Cropped = gray[topx:bottomx+1, topy:bottomy+1]

    text = pytesseract.image_to_string(Cropped, config='--psm 11')
    if len(text) >= 8:
        number = ""
        alpha_counter = 0
        for simvol in text:
            if simvol.isdigit() or (simvol.isalpha() and simvol.isupper()):
                if (simvol.isalpha() and simvol.isupper()):
                    alpha_counter += 1
                number += simvol
        number = ''.join(filter(str.isdigit, number))
        number = number[-3:]
        
        if len(number) > 2:
            sendDataToServer(number)
space = round(time()*1000) + 40
def process_frames(cam1, cam2, barrier):
    global space
    camera = cv2.VideoCapture(cam1)
    global threads
    while True:
        if space > round(time()*1000):
            camera.read()
        else:
            space = round(time()*1000) + 50
            ret, frame = camera.read()
            if not ret:
                break
            thread = threading.Thread(target=recognize, args=(frame,))
            frame2 = frame.copy()
            start_point = (600, 350)
            end_point = (1200, 750)
            color = (155, 100, 0)
            thickness = 2
            image = cv2.rectangle(frame2, start_point, end_point, color, thickness)
            height, width, _ = image.shape
            width = int(width / 2)
            height = int(height / 2)
            image = cv2.resize(image, (width, height))
            cv2.imshow('cam1',image)
            threads.append(thread)
            thread.start()
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
    print("closed!")
    camera.release()
    for thread in threads:
        thread.join()
    cv2.destroyAllWindows()
cams = getCamAddress()
barriers = getBarrierAddress()
if cams != "error":
    cams = json.loads(cams)
    barriers = json.loads(barriers)
    try:
        cam1 = cams[0]['address']
        cam2 = cams[1]['address']
        barrier = barriers[0]['address']
        print("Cam1: " + cam1 + "\tCam2: " + cam2 + "\tBarrier: " + barrier)
        process_frames(cam1, cam2, barrier)
    except:
        print("cam instialization error!")
