import cv2
import imutils
import numpy as np
import pytesseract
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
from time import time
    
frame = cv2.imread("car_image.png")
time_start = round(time()*1000)
# frame = img[350:550, 700:1100] #img[y:y+h, x:x+w] 1280x720
framex = frame.copy()
cv2.imwrite('test/1_photo.png', framex)
img = frame
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
cv2.imwrite('test/2_cvtColor.png', gray)
gray = cv2.bilateralFilter(gray, 13, 15, 15)
cv2.imwrite('test/3_bilateralFilter.png', gray)
edged = cv2.Canny(gray, 30, 200)
cv2.imwrite('test/4_Canny.png', edged)
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
else:
    detected = 1

if detected == 1:
    cv2.drawContours(frame, [screenCnt], -1, (0, 200, 50), 1)
cv2.imwrite('test/5_drawContours.png', frame)
mask = np.zeros(gray.shape,np.uint8)
new_image = cv2.drawContours(mask,[screenCnt],0,255,-1,)
new_image = cv2.bitwise_and(img,img,mask=mask)
cv2.imwrite('test/6_new_image.png', new_image)
cv2.drawContours(mask,[screenCnt],0,255,-1,)
cv2.imwrite('test/7_mask.png', mask)
(x, y) = np.where(mask == 255)
(topx, topy) = (np.min(x), np.min(y))
(bottomx, bottomy) = (np.max(x), np.max(y))
Cropped = gray[topx:bottomx+1, topy:bottomy+1]
cv2.imwrite('test/8_Cropped.png', Cropped)
text = pytesseract.image_to_string(Cropped, config='--psm 11')
if len(text) >= 7:
    number = ""
    alpha_counter = 0
    for simvol in text:
        if simvol.isdigit() or (simvol.isalpha() and simvol.isupper()):
            if (simvol.isalpha() and simvol.isupper()):
                alpha_counter += 1
            number += simvol
    if len(number) >= 6 and alpha_counter <= 4:
        cv2.imwrite('test/9_img.png',frame)
        print(number, round(time()*1000)-time_start)
    

cv2.destroyAllWindows()