# 🚀 QUICK START - SIMPLE INSTRUCTIONS

## ✅ YOUR SYSTEM IS READY!

---

## 🎯 TO START EVERYTHING:

**Double-click this file:**
```
D:\MERN\Movia\START.bat
```

That's it! You'll see 3 windows open. **Don't close them.**

---

## 🛑 TO STOP EVERYTHING:

**Double-click this file:**
```
D:\MERN\Movia\STOP.bat
```

---

## 📤 TO UPLOAD A VIDEO:

1. Go to: **http://localhost:3000/upload**
2. Choose your video file
3. Click Upload
4. Wait for encoding (GPU will work automatically)

**Encoding time:** 4 minutes per 1 minute of video

---

## 🪟 THE 3 WINDOWS (Don't close them!):

1. **Movia Backend** - Server running
2. **Movia HLS Worker** - ⭐ **THIS SHOWS ENCODING PROGRESS**
3. **Movia Frontend** - Website running

**Redis runs minimized** - you won't see it.

---

## 📊 TO CHECK IF IT'S WORKING:

Open: **http://localhost:3000**

You should see your video site!

---

## 🎮 GPU ENCODING:

Your NVIDIA RTX 2050 will automatically encode videos.

**To watch GPU work:**
```powershell
nvidia-smi -l 1
```
Press Ctrl+C to stop.

During encoding you'll see: **60-80% GPU usage** ✅

---

## ⚠️ IMPORTANT:

- **ALWAYS use START.bat to start** (not manual commands)
- **Keep the 3 windows open** while site is running
- **Only upload 1 video at a time**
- **Wait for encoding to finish** before uploading another

---

## 🐛 IF SOMETHING BREAKS:

1. Run **STOP.bat**
2. Wait 10 seconds
3. Run **START.bat** again

---

## 📞 CURRENT STATUS:

✅ All services running  
✅ Backend: http://localhost:5000  
✅ Frontend: http://localhost:3000  
✅ GPU: Ready for encoding  
✅ Redis: Connected  

**You can upload videos now!** 🎬

---

**Your site:** http://localhost:3000  
**Upload page:** http://localhost:3000/upload
