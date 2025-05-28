// components/student-dashboard.js
import { logoutUser } from '../utils/auth.js';
import { getBatches, getSubjects, getChapters, getContent } from '../utils/firestore.js';
import { clearElement, createButton } from './common-ui.js';

let currentSelectedBatchIdStudent = null;
let currentSelectedSubjectIdStudent = null;
let currentSelectedChapterIdStudent = null;

async function renderStudentDashboard(appContainer) {
    clearElement(appContainer);

    const dashboardContainer = document.createElement('div');
    dashboardContainer.className = 'dashboard-container';

    const header = document.createElement('div');
    header.className = 'dashboard-header';
    const title = document.createElement('h2');
    title.textContent = 'Student Dashboard';
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

    renderStudentBatchView(mainContent);
}

async function renderStudentBatchView(container) {
    clearElement(container);
    container.innerHTML = '<h3>Available Batches</h3>';

    const batchList = document.createElement('div');
    batchList.className = 'list-container';
    container.appendChild(batchList);

    const batches = await getBatches();
    if (batches.length === 0) {
        batchList.innerHTML = '<p>No batches available yet.</p>';
    } else {
        batches.forEach(batch => {
            const batchItem = document.createElement('div');
            batchItem.className = 'list-item';
            batchItem.innerHTML = `<span>${batch.name}</span>`;
            const viewButton = createButton('View Subjects', 'action-button', () => {
                currentSelectedBatchIdStudent = batch.id;
                renderStudentSubjectView(container);
            });
            batchItem.appendChild(viewButton);
            batchList.appendChild(batchItem);
        });
    }
}

async function renderStudentSubjectView(container) {
    if (!currentSelectedBatchIdStudent) {
        renderStudentBatchView(container);
        return;
    }

    clearElement(container);
    container.innerHTML = `<h3>Subjects in Batch</h3>`;

    const backToBatchesBtn = createButton('Back to Batches', 'back-button', () => {
        currentSelectedBatchIdStudent = null;
        renderStudentBatchView(container);
    });
    container.appendChild(backToBatchesBtn);

    const subjectList = document.createElement('div');
    subjectList.className = 'list-container';
    container.appendChild(subjectList);

    const subjects = await getSubjects(currentSelectedBatchIdStudent);
    if (subjects.length === 0) {
        subjectList.innerHTML = '<p>No subjects available for this batch.</p>';
    } else {
        subjects.forEach(subject => {
            const subjectItem = document.createElement('div');
            subjectItem.className = 'list-item';
            subjectItem.innerHTML = `<span>${subject.name}</span>`;
            const viewButton = createButton('View Chapters', 'action-button', () => {
                currentSelectedSubjectIdStudent = subject.id;
                renderStudentChapterView(container);
            });
            subjectItem.appendChild(viewButton);
            subjectList.appendChild(subjectItem);
        });
    }
}

async function renderStudentChapterView(container) {
    if (!currentSelectedSubjectIdStudent) {
        renderStudentSubjectView(container);
        return;
    }

    clearElement(container);
    container.innerHTML = `<h3>Chapters in Subject</h3>`;

    const backToSubjectsBtn = createButton('Back to Subjects', 'back-button', () => {
        currentSelectedSubjectIdStudent = null;
        renderStudentSubjectView(container);
    });
    container.appendChild(backToSubjectsBtn);

    const chapterList = document.createElement('div');
    chapterList.className = 'list-container';
    container.appendChild(chapterList);

    const chapters = await getChapters(currentSelectedSubjectIdStudent);
    if (chapters.length === 0) {
        chapterList.innerHTML = '<p>No chapters available for this subject.</p>';
    } else {
        chapters.forEach(chapter => {
            const chapterItem = document.createElement('div');
            chapterItem.className = 'list-item';
            chapterItem.innerHTML = `<span>${chapter.name}</span>`;
            const viewButton = createButton('View Content', 'action-button', () => {
                currentSelectedChapterIdStudent = chapter.id;
                renderStudentContentView(container);
            });
            chapterItem.appendChild(viewButton);
            chapterList.appendChild(chapterItem);
        });
    }
}

async function renderStudentContentView(container) {
    if (!currentSelectedChapterIdStudent) {
        renderStudentChapterView(container);
        return;
    }

    clearElement(container);
    container.innerHTML = `<h3>Content for Chapter</h3>`;

    const backToChaptersBtn = createButton('Back to Chapters', 'back-button', () => {
        currentSelectedChapterIdStudent = null;
        renderStudentChapterView(container);
    });
    container.appendChild(backToChaptersBtn);

    const contentList = document.createElement('div');
    contentList.className = 'content-list';
    container.appendChild(contentList);

    const contentItems = await getContent(currentSelectedChapterIdStudent);
    if (contentItems.length === 0) {
        contentList.innerHTML = '<p>No content available for this chapter.</p>';
    } else {
        contentItems.forEach(item => {
            const contentItemDiv = document.createElement('div');
            contentItemDiv.className = 'content-item';
            contentItemDiv.innerHTML = `<h4>${item.type.toUpperCase()}</h4>`;
            if (item.description) {
                contentItemDiv.innerHTML += `<p>${item.description}</p>`;
            }

            if (item.type === 'video') {
                // Basic embedding for YouTube/Vimeo. More robust solution might be needed.
                // You might need to parse item.url to get the correct embed URL
                // For YouTube: https://www.youtube.com/embed/VIDEO_ID
                // For Vimeo: https://player.vimeo.com/video/VIDEO_ID
                const videoIdMatch = item.url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
                if (videoIdMatch && videoIdMatch[1]) {
                    contentItemDiv.innerHTML += `<iframe src="https://www.youtube.com/embed/${videoIdMatch[1]}" frameborder="0" allowfullscreen></iframe>`;
                } else {
                    contentItemDiv.innerHTML += `<a href="${item.url}" target="_blank">Watch Video</a>`;
                }

            } else if (item.type === 'pdf') {
                // Embed PDF or provide a link
                contentItemDiv.innerHTML += `<iframe src="${item.url}" width="100%" height="500px"></iframe>`;
                contentItemDiv.innerHTML += `<p><a href="${item.url}" target="_blank">Open PDF in new tab</a></p>`;
            }
            contentList.appendChild(contentItemDiv);
        });
    }
}


export { renderStudentDashboard };
