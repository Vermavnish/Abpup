// components/admin-dashboard.js
import { logoutUser, ADMIN_EMAIL } from '../utils/auth.js';
import { createBatch, getBatches, deleteBatch,
         createSubject, getSubjects, deleteSubject,
         createChapter, getChapters, deleteChapter,
         createContent, getContent, deleteContent } from '../utils/firestore.js';
import { clearElement, createButton, createInput } from './common-ui.js';

let currentSelectedBatchId = null;
let currentSelectedSubjectId = null;
let currentSelectedChapterId = null;

async function renderAdminDashboard(appContainer) {
    clearElement(appContainer);

    const dashboardContainer = document.createElement('div');
    dashboardContainer.className = 'dashboard-container';

    const header = document.createElement('div');
    header.className = 'dashboard-header';
    const title = document.createElement('h2');
    title.textContent = 'Admin Dashboard';
    header.appendChild(title);
    const logoutBtn = createButton('Logout', 'logout-button', async () => {
        await logoutUser();
        // The main script.js will handle redirect to login
    });
    header.appendChild(logoutBtn);
    dashboardContainer.appendChild(header);

    const mainContent = document.createElement('div');
    mainContent.className = 'main-content';
    dashboardContainer.appendChild(mainContent);

    appContainer.appendChild(dashboardContainer);

    // Render Batch Management by default
    renderBatchManagement(mainContent);
}

async function renderBatchManagement(container) {
    clearElement(container);
    container.innerHTML = '<h3>Batch Management</h3>';

    // Form to add new batch
    const batchForm = document.createElement('form');
    batchForm.className = 'input-form';
    const batchInput = createInput('text', 'Batch Name', 'form-input');
    batchForm.appendChild(batchInput);
    const addBatchBtn = createButton('Add Batch', 'form-button', async () => {
        if (batchInput.value.trim()) {
            await createBatch(batchInput.value);
            batchInput.value = '';
            renderBatchManagement(container); // Re-render to show new batch
        } else {
            alert('Batch name cannot be empty.');
        }
    });
    batchForm.appendChild(addBatchBtn);
    container.appendChild(batchForm);

    // List of existing batches
    const batchList = document.createElement('div');
    batchList.className = 'list-container';
    container.appendChild(batchList);

    const batches = await getBatches();
    if (batches.length === 0) {
        batchList.innerHTML = '<p>No batches created yet.</p>';
    } else {
        batches.forEach(batch => {
            const batchItem = document.createElement('div');
            batchItem.className = 'list-item';
            batchItem.innerHTML = `<span>${batch.name}</span>`;

            const actionsDiv = document.createElement('div');
            const viewSubjectsBtn = createButton('View Subjects', 'action-button', () => {
                currentSelectedBatchId = batch.id;
                renderSubjectManagement(container);
            });
            const deleteBtn = createButton('Delete', 'delete-button', async () => {
                if (confirm(`Are you sure you want to delete batch "${batch.name}"?`)) {
                    await deleteBatch(batch.id);
                    renderBatchManagement(container); // Re-render
                }
            });
            actionsDiv.appendChild(viewSubjectsBtn);
            actionsDiv.appendChild(deleteBtn);
            batchItem.appendChild(actionsDiv);
            batchList.appendChild(batchItem);
        });
    }
}

async function renderSubjectManagement(container) {
    if (!currentSelectedBatchId) {
        console.error("No batch selected for subject management.");
        renderBatchManagement(container); // Fallback
        return;
    }

    clearElement(container);
    container.innerHTML = `<h3>Subject Management for Batch: ${await getBatchName(currentSelectedBatchId)}</h3>`; // Get batch name for display

    const backToBatchesBtn = createButton('Back to Batches', 'back-button', () => {
        currentSelectedBatchId = null;
        renderBatchManagement(container);
    });
    container.appendChild(backToBatchesBtn);

    const subjectForm = document.createElement('form');
    subjectForm.className = 'input-form';
    const subjectInput = createInput('text', 'Subject Name', 'form-input');
    subjectForm.appendChild(subjectInput);
    const addSubjectBtn = createButton('Add Subject', 'form-button', async () => {
        if (subjectInput.value.trim()) {
            await createSubject(currentSelectedBatchId, subjectInput.value);
            subjectInput.value = '';
            renderSubjectManagement(container); // Re-render
        } else {
            alert('Subject name cannot be empty.');
        }
    });
    subjectForm.appendChild(addSubjectBtn);
    container.appendChild(subjectForm);

    const subjectList = document.createElement('div');
    subjectList.className = 'list-container';
    container.appendChild(subjectList);

    const subjects = await getSubjects(currentSelectedBatchId);
    if (subjects.length === 0) {
        subjectList.innerHTML = '<p>No subjects created yet for this batch.</p>';
    } else {
        subjects.forEach(subject => {
            const subjectItem = document.createElement('div');
            subjectItem.className = 'list-item';
            subjectItem.innerHTML = `<span>${subject.name}</span>`;

            const actionsDiv = document.createElement('div');
            const viewChaptersBtn = createButton('View Chapters', 'action-button', () => {
                currentSelectedSubjectId = subject.id;
                renderChapterManagement(container);
            });
            const deleteBtn = createButton('Delete', 'delete-button', async () => {
                if (confirm(`Are you sure you want to delete subject "${subject.name}"?`)) {
                    await deleteSubject(subject.id);
                    renderSubjectManagement(container); // Re-render
                }
            });
            actionsDiv.appendChild(viewChaptersBtn);
            actionsDiv.appendChild(deleteBtn);
            subjectItem.appendChild(actionsDiv);
            subjectList.appendChild(subjectItem);
        });
    }
}

async function renderChapterManagement(container) {
    if (!currentSelectedSubjectId) {
        console.error("No subject selected for chapter management.");
        renderSubjectManagement(container); // Fallback
        return;
    }

    clearElement(container);
    container.innerHTML = `<h3>Chapter Management for Subject: ${await getSubjectName(currentSelectedSubjectId)}</h3>`;

    const backToSubjectsBtn = createButton('Back to Subjects', 'back-button', () => {
        currentSelectedSubjectId = null;
        renderSubjectManagement(container);
    });
    container.appendChild(backToSubjectsBtn);

    const chapterForm = document.createElement('form');
    chapterForm.className = 'input-form';
    const chapterInput = createInput('text', 'Chapter Name', 'form-input');
    chapterForm.appendChild(chapterInput);
    const addChapterBtn = createButton('Add Chapter', 'form-button', async () => {
        if (chapterInput.value.trim()) {
            await createChapter(currentSelectedSubjectId, chapterInput.value);
            chapterInput.value = '';
            renderChapterManagement(container); // Re-render
        } else {
            alert('Chapter name cannot be empty.');
        }
    });
    chapterForm.appendChild(addChapterBtn);
    container.appendChild(chapterForm);

    const chapterList = document.createElement('div');
    chapterList.className = 'list-container';
    container.appendChild(chapterList);

    const chapters = await getChapters(currentSelectedSubjectId);
    if (chapters.length === 0) {
        chapterList.innerHTML = '<p>No chapters created yet for this subject.</p>';
    } else {
        chapters.forEach(chapter => {
            const chapterItem = document.createElement('div');
            chapterItem.className = 'list-item';
            chapterItem.innerHTML = `<span>${chapter.name}</span>`;

            const actionsDiv = document.createElement('div');
            const viewContentBtn = createButton('View Content', 'action-button', () => {
                currentSelectedChapterId = chapter.id;
                renderContentManagement(container);
            });
            const deleteBtn = createButton('Delete', 'delete-button', async () => {
                if (confirm(`Are you sure you want to delete chapter "${chapter.name}"?`)) {
                    await deleteChapter(chapter.id);
                    renderChapterManagement(container); // Re-render
                }
            });
            actionsDiv.appendChild(viewContentBtn);
            actionsDiv.appendChild(deleteBtn);
            chapterItem.appendChild(actionsDiv);
            chapterList.appendChild(chapterItem);
        });
    }
}


async function renderContentManagement(container) {
    if (!currentSelectedChapterId) {
        console.error("No chapter selected for content management.");
        renderChapterManagement(container); // Fallback
        return;
    }

    clearElement(container);
    container.innerHTML = `<h3>Content Management for Chapter: ${await getChapterName(currentSelectedChapterId)}</h3>`;

    const backToChaptersBtn = createButton('Back to Chapters', 'back-button', () => {
        currentSelectedChapterId = null;
        renderChapterManagement(container);
    });
    container.appendChild(backToChaptersBtn);

    const contentForm = document.createElement('form');
    contentForm.className = 'input-form';

    const urlInput = createInput('text', 'Video/PDF URL', 'form-input');
    contentForm.appendChild(urlInput);

    const typeSelect = document.createElement('select');
    typeSelect.className = 'form-input';
    const videoOption = document.createElement('option');
    videoOption.value = 'video';
    videoOption.textContent = 'Video';
    const pdfOption = document.createElement('option');
    pdfOption.value = 'pdf';
    pdfOption.textContent = 'PDF';
    typeSelect.appendChild(videoOption);
    typeSelect.appendChild(pdfOption);
    contentForm.appendChild(typeSelect);

    const descriptionInput = createInput('text', 'Description (Optional)', 'form-input');
    contentForm.appendChild(descriptionInput);

    const addContentBtn = createButton('Add Content', 'form-button', async () => {
        if (urlInput.value.trim()) {
            await createContent(currentSelectedChapterId, typeSelect.value, urlInput.value, descriptionInput.value);
            urlInput.value = '';
            descriptionInput.value = '';
            renderContentManagement(container); // Re-render
        } else {
            alert('URL cannot be empty.');
        }
    });
    contentForm.appendChild(addContentBtn);
    container.appendChild(contentForm);

    const contentList = document.createElement('div');
    contentList.className = 'list-container';
    container.appendChild(contentList);

    const contentItems = await getContent(currentSelectedChapterId);
    if (contentItems.length === 0) {
        contentList.innerHTML = '<p>No content added yet for this chapter.</p>';
    } else {
        contentItems.forEach(item => {
            const contentItemDiv = document.createElement('div');
            contentItemDiv.className = 'list-item';
            contentItemDiv.style.flexDirection = 'column'; // Stack content

            const title = document.createElement('span');
            title.textContent = `Type: ${item.type.toUpperCase()} - URL: ${item.url}`;
            contentItemDiv.appendChild(title);

            if (item.description) {
                const desc = document.createElement('span');
                desc.textContent = `Description: ${item.description}`;
                desc.style.fontSize = '0.9em';
                desc.style.color = '#555';
                contentItemDiv.appendChild(desc);
            }

            const actionsDiv = document.createElement('div');
            actionsDiv.style.marginTop = '10px';
            const deleteBtn = createButton('Delete', 'delete-button', async () => {
                if (confirm(`Are you sure you want to delete this ${item.type} content?`)) {
                    await deleteContent(item.id);
                    renderContentManagement(container); // Re-render
                }
            });
            actionsDiv.appendChild(deleteBtn);
            contentItemDiv.appendChild(actionsDiv);
            contentList.appendChild(contentItemDiv);
        });
    }
}

// Helper functions to get names for display (from Firestore)
async function getBatchName(batchId) {
    const doc = await db.collection("batches").doc(batchId).get();
    return doc.exists ? doc.data().name : 'Unknown Batch';
}

async function getSubjectName(subjectId) {
    const doc = await db.collection("subjects").doc(subjectId).get();
    return doc.exists ? doc.data().name : 'Unknown Subject';
}

async function getChapterName(chapterId) {
    const doc = await db.collection("chapters").doc(chapterId).get();
    return doc.exists ? doc.data().name : 'Unknown Chapter';
}


export { renderAdminDashboard };
