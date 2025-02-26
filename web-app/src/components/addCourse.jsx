import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { 
  TextField, Button, Container, Typography, Card, CardContent, CardActions 
} from '@mui/material';

const AddCourse = () => {
  const [courseID, setCourseID] = useState('');
  const [courseName, setCourseName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imagePreview, setImagePreview] = useState(null);

  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImageToStorage = async (file) => {
    if (!file) return null;
    const uniqueFileName = `${Date.now()}-${file.name}`;
    const storageRef = ref(storage, `classroom_images/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(progress);
        },
        (error) => {
          console.error("Upload error:", error);
          alert("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  const handleSaveCourse = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("กรุณาเข้าสู่ระบบ");
      return;
    }

    try {
      setUploading(true);
      const imageUrl = await uploadImageToStorage(imageFile);

      const courseRef = doc(collection(db, "classroom"));
      const courseData = {
        courseID,
        courseName,
        roomName,
        imageURL: imageUrl,
        owner: user.uid,
      };

      await setDoc(courseRef, courseData);
      await setDoc(doc(db, `users/${user.uid}/classroom/${courseRef.id}`), { status: 1 });

      alert("บันทึกคอร์สสำเร็จ!");
      navigate("/home");
    } catch (error) {
      console.error("Error saving course:", error);
      alert("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <Card sx={{ 
        bgcolor: "#F3E5F5", 
        borderRadius: 4, 
        boxShadow: 4,
        padding: 3,
        maxWidth: "100%",
      }}>
        <CardContent>
          <Typography variant="h4" align="center" color="#6A1B9A" fontWeight="bold">
            เพิ่มห้องเรียน
          </Typography>

          <TextField
            label="รหัสวิชา"
            variant="outlined"
            fullWidth
            margin="normal"
            value={courseID}
            onChange={(e) => setCourseID(e.target.value)}
            sx={{ bgcolor: "white", borderRadius: 2 }}
          />
          <TextField
            label="ชื่อวิชา"
            variant="outlined"
            fullWidth
            margin="normal"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            sx={{ bgcolor: "white", borderRadius: 2 }}
          />
          <TextField
            label="รหัสห้องเรียน"
            variant="outlined"
            fullWidth
            margin="normal"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            sx={{ bgcolor: "white", borderRadius: 2 }}
          />

          <input
            type="file"
            accept="image/*"
            id="file-upload"
            onChange={handleImageChange}
            style={{ display: "none" }}
          />
          <label htmlFor="file-upload">
            <Button variant="contained" component="span" fullWidth sx={{
              bgcolor: "#AB47BC", 
              "&:hover": { bgcolor: "#8E24AA" }, 
              mt: 2, 
              borderRadius: 2
            }}>
              เลือกรูปภาพ
            </Button>
          </label>

          {imagePreview && (
            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <img src={imagePreview} alt="Preview" style={{ maxWidth: "100%", borderRadius: 8, boxShadow: "0 3px 6px rgba(0,0,0,0.2)" }} />
            </div>
          )}
        </CardContent>

        <CardActions>
          <Button
            variant="contained"
            fullWidth
            onClick={handleSaveCourse}
            disabled={uploading || !imageFile}
            sx={{ 
              bgcolor: "#7B1FA2", 
              "&:hover": { bgcolor: "#6A1B9A" },
              borderRadius: 2
            }}
          >
            {uploading ? 'กำลังอัปโหลด...' : 'บันทึกข้อมูล'}
          </Button>
        </CardActions>
      </Card>
    </Container>
  );
};

export default AddCourse;
