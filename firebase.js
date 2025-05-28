// utils/firestore.js
import { db } from '../firebase-config.js';

// --- Batch Operations ---
async function createBatch(name) {
    try {
        const docRef = await db.collection("batches").add({
            name: name,
            createdAt: firebase.firestore.FieldValue.serverTimestamp() // Use server timestamp
        });
        return { id: docRef.id, name: name };
    } catch (e) {
        console.error("Error adding document: ", e);
        throw e;
    }
}

async function getBatches() {
    try {
        const snapshot = await db.collection("batches").orderBy("createdAt", "desc").get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.error("Error getting batches: ", e);
        throw e;
    }
}

async function deleteBatch(id) {
    try {
        await db.collection("batches").doc(id).delete();
        console.log("Batch successfully deleted!");
    } catch (e) {
        console.error("Error removing batch: ", e);
        throw e;
    }
}

// --- Subject Operations ---
async function createSubject(batchId, name) {
    try {
        const docRef = await db.collection("subjects").add({
            batchId: batchId,
            name: name,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return { id: docRef.id, name: name };
    } catch (e) {
        console.error("Error adding subject: ", e);
        throw e;
    }
}

async function getSubjects(batchId) {
    try {
        const snapshot = await db.collection("subjects")
                                .where("batchId", "==", batchId)
                                .orderBy("createdAt", "desc")
                                .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.error("Error getting subjects: ", e);
        throw e;
    }
}

async function deleteSubject(id) {
    try {
        await db.collection("subjects").doc(id).delete();
        console.log("Subject successfully deleted!");
    } catch (e) {
        console.error("Error removing subject: ", e);
        throw e;
    }
}

// --- Chapter Operations ---
async function createChapter(subjectId, name) {
    try {
        const docRef = await db.collection("chapters").add({
            subjectId: subjectId,
            name: name,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return { id: docRef.id, name: name };
    } catch (e) {
        console.error("Error adding chapter: ", e);
        throw e;
    }
}

async function getChapters(subjectId) {
    try {
        const snapshot = await db.collection("chapters")
                                .where("subjectId", "==", subjectId)
                                .orderBy("createdAt", "desc")
                                .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.error("Error getting chapters: ", e);
        throw e;
    }
}

async function deleteChapter(id) {
    try {
        await db.collection("chapters").doc(id).delete();
        console.log("Chapter successfully deleted!");
    } catch (e) {
        console.error("Error removing chapter: ", e);
        throw e;
    }
}

// --- Content Operations (Videos/PDFs) ---
async function createContent(chapterId, type, url, description = '') {
    try {
        const docRef = await db.collection("content").add({
            chapterId: chapterId,
            type: type, // 'video' or 'pdf'
            url: url,
            description: description,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return { id: docRef.id, url: url, type: type };
    } catch (e) {
        console.error("Error adding content: ", e);
        throw e;
    }
}

async function getContent(chapterId) {
    try {
        const snapshot = await db.collection("content")
                                .where("chapterId", "==", chapterId)
                                .orderBy("createdAt", "desc")
                                .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.error("Error getting content: ", e);
        throw e;
    }
}

async function deleteContent(id) {
    try {
        await db.collection("content").doc(id).delete();
        console.log("Content successfully deleted!");
    } catch (e) {
        console.error("Error removing content: ", e);
        throw e;
    }
}


export {
    createBatch, getBatches, deleteBatch,
    createSubject, getSubjects, deleteSubject,
    createChapter, getChapters, deleteChapter,
    createContent, getContent, deleteContent
};

