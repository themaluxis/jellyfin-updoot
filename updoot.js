(function() {
    const config = {
        serverUrl: 'https://YOURDOMAINNAMEHERE',
        adminUserIds: ['USERID1', 'USERID2']
    };

    const state = {
        apiKey: '',
        userId: '',
        backendUrl: `${window.location.origin}/updoot`,
        recommendButton: null,
        recommendationsButton: null,
        adminButton: null,
        overlay: null,
        adminOverlay: null
    };

    function init() {
        console.log('Jellyfin Updoot: Initializing');
        loadStyles();
        loadCredentials();
        if (state.userId) {
            main();
        } else {
            console.error('Jellyfin Updoot: Could not retrieve user credentials.');
        }
    }

    function loadStyles() {
        if (!document.querySelector('link[href*="material-icons"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
            document.head.appendChild(link);
        }
        if (!document.querySelector('#updoot-styles')) {
            const link = document.createElement('link');
            link.id = 'updoot-styles';
            link.rel = 'stylesheet';
            link.href = 'updoot.css';
            document.head.appendChild(link);
        }
    }

    function loadCredentials() {
        const jellyfinCredentials = JSON.parse(localStorage.getItem('jellyfin_credentials') || '{}');
        const server = jellyfinCredentials.Servers && jellyfinCredentials.Servers[0];
        if (server) {
            state.apiKey = server.AccessToken;
            state.userId = server.UserId;
            if (!config.serverUrl.startsWith('http')) {
                config.serverUrl = server.ManualAddress || server.LocalAddress;
            }
        }
    }

    function main() {
        console.log('Jellyfin Updoot: Starting main execution');
        setupNavigationListener();
        run();
    }

    function run() {
        cleanupExistingElements();
        addButtons();
    }

    async function fetchItemDetails(itemId) {
            console.log('Fetching item details for itemId:', itemId);
            try {
                const url = `${serverUrl}/Items/${itemId}?api_key=${apiKey}`;
                console.log('Requesting:', url);
                const response = await fetch(url, {
                    method: 'GET',
                    headers: { 'X-Emby-Token': apiKey }
                });
                if (!response.ok) {
                    console.error('Fetch item details failed:', `HTTP ${response.status}`);
                    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
                }
                const data = await response.json();
                console.log('Item details received:', data);
                return data;
            } catch (error) {
                console.error('Error fetching item details:', error.message);
                return null;
            }
        }

        function createRecommendButton(playButton) {
            console.log('Attempting to create Recommend button');
            if (!playButton || !playButton.parentNode) {
                console.log('Play button or its parent not found');
                return;
            }
            if (document.querySelector('.btnRecommend')) {
                console.log('Recommend button already exists');
                return;
            }

            console.log('Creating Recommend button');
            recommendButton = document.createElement('button');
            recommendButton.setAttribute('is', 'paper-icon-button-light');
            recommendButton.className = 'btnRecommend detailButton emby-button paper-icon-button-light';
            recommendButton.title = 'Recommend';
            recommendButton.innerHTML = '<span class="material-icons thumb_up" aria-hidden="true"></span>';
            recommendButton.style.backgroundColor = '#00ff0000';
            try {
                const playWidth = parseFloat(getComputedStyle(playButton).width) || 40;
                const playHeight = parseFloat(getComputedStyle(playButton).height) || 40;
                recommendButton.style.width = `${playWidth * 1.2}px`;
                recommendButton.style.height = `${playHeight * 1.2}px`;
            } catch (error) {
                console.error('Error setting Recommend button size:', error.message);
                recommendButton.style.width = '48px';
                recommendButton.style.height = '48px';
            }

            try {
                playButton.parentNode.insertBefore(recommendButton, playButton.nextSibling || null);
                console.log('Recommend button inserted');
            } catch (error) {
                console.error('Error inserting Recommend button:', error.message);
                const targetContainer = document.querySelector('.detailPagePrimaryContainer, .detailButton-container');
                if (targetContainer) {
                    targetContainer.appendChild(recommendButton);
                    console.log('Recommend button appended to targetContainer');
                }
            }

            const displayArea = document.createElement('div');
            displayArea.className = 'recommendationArea';
            const targetContainer = playButton.closest('.mainDetailButtons, .detailButton-container, .detailPagePrimaryContainer');
            if (targetContainer) {
                targetContainer.appendChild(displayArea);
                console.log('Recommendation display area added');
            } else {
                console.log('Target container for display area not found');
            }

            createCommentsSection(targetContainer);

            recommendButton.addEventListener('click', () => {
                console.log('Recommend button clicked at ' + new Date().toISOString());
                recommendButton.style.opacity = '0.5';
                toggleRecommendation().finally(() => {
                    setTimeout(() => {
                        recommendButton.style.opacity = '1';
                        console.log('Recommend button opacity reset');
                    }, 1000);
                });
            });

            updateRecommendationDisplay();
        }

        function createCommentsSection(targetContainer) {
            console.log('Attempting to create comments section');
            if (!targetContainer) {
                console.log('Target container for comments section not found');
                return;
            }
            if (document.querySelector('.commentsSection')) {
                console.log('Comments section already exists');
                return;
            }

            console.log('Creating comments section');
            const commentsSection = document.createElement('div');
            commentsSection.className = 'commentsSection';
            commentsSection.style.cssText = `
                margin-top: 20px;
                padding: 10px;
                background: transparent;
                border-radius: 8px;
                position: relative;
                z-index: 100;
                height: auto;
            `;

            const addCommentButton = document.createElement('button');
            addCommentButton.textContent = '+ Add Comment';
            addCommentButton.style.cssText = `
                background: #4CAF50;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                margin-bottom: 10px;
            `;
            addCommentButton.addEventListener('click', () => {
                console.log('Add Comment button clicked');
                if (!userId) {
                    console.log('No userId, cannot show comment form');
                    alert('Please log in to add a comment');
                    return;
                }
                commentForm.style.display = commentForm.style.display === 'none' ? 'block' : 'none';
            });

            const commentForm = document.createElement('div');
            commentForm.style.display = 'none';
            commentForm.innerHTML = `
                <textarea style="width: 100%; height: 60px; margin-bottom: 10px; border-radius: 4px; padding: 8px;" placeholder="Write your comment..."></textarea>
                <button style="background: #4CAF50; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Send</button>
            `;
            const sendButton = commentForm.querySelector('button');
            sendButton.addEventListener('click', () => {
                console.log('Send comment button clicked');
                const textarea = commentForm.querySelector('textarea');
                const comment = textarea.value.trim();
                if (comment) {
                    submitComment(comment).then(() => {
                        textarea.value = '';
                        commentForm.style.display = 'none';
                        updateCommentsDisplay();
                    });
                } else {
                    console.log('Empty comment, not submitting');
                    alert('Comment cannot be empty');
                }
            });

            const commentsDisplay = document.createElement('div');
            commentsDisplay.className = 'commentsDisplay';
            commentsDisplay.style.cssText = `
                margin-top: 10px;
                height: auto;
                overflow-y: visible;
            `;

            commentsSection.appendChild(addCommentButton);
            commentsSection.appendChild(commentForm);
            commentsSection.appendChild(commentsDisplay);

            const primaryContent = document.querySelector('.detailPagePrimaryContent.padded-right');
            if (primaryContent && primaryContent.parentNode) {
                primaryContent.parentNode.insertBefore(commentsSection, primaryContent.nextSibling);
                console.log('Comments section inserted below .detailPagePrimaryContent');
            } else {
                console.log('Primary content not found, appending to targetContainer');
                targetContainer.appendChild(commentsSection);
            }

            updateCommentsDisplay();
        }

        async function submitComment(comment) {
            console.log('Submitting comment for userId:', userId);
            const itemId = getItemId();
            if (!itemId) {
                console.log('No itemId found for comment');
                alert('Cannot add comment: Item not found');
                return;
            }
            if (!userId) {
                console.log('No userId found for comment');
                alert('Please log in to add a comment');
                return;
            }

            try {
                const url = `${backendUrl}/comments`;
                console.log('Submitting comment to:', url, { userId, itemId, comment });
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, itemId, comment })
                });
                if (!response.ok) {
                    console.error('Comment submission failed:', `HTTP ${response.status}`);
                    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
                }
                console.log('Comment submitted successfully');
            } catch (error) {
                console.error('Error submitting comment:', error.message);
                alert('Failed to submit comment: ' + error.message);
            }
        }

        async function editComment(commentId, newComment) {
            console.log('Editing comment:', commentId);
            if (!userId) {
                console.log('No userId found for editing comment');
                alert('Please log in to edit comment');
                return;
            }

            try {
                const url = `${backendUrl}/comments/${commentId}`;
                console.log('Editing comment at:', url, { userId, comment: newComment });
                const response = await fetch(url, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, comment: newComment })
                });
                if (!response.ok) {
                    console.error('Comment edit failed:', `HTTP ${response.status}`);
                    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
                }
                console.log('Comment edited successfully');
                updateCommentsDisplay();
            } catch (error) {
                console.error('Error editing comment:', error.message);
                alert('Failed to edit comment: ' + error.message);
            }
        }

        async function deleteComment(commentId) {
            console.log('Deleting comment:', commentId);
            if (!userId) {
                console.log('No userId found for deleting comment');
                alert('Please log in to delete comment');
                return;
            }

            try {
                const url = `${backendUrl}/comments/${commentId}`;
                console.log('Deleting comment at:', url, { userId });
                const response = await fetch(url, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId })
                });
                if (!response.ok) {
                    console.error('Comment deletion failed:', `HTTP ${response.status}`);
                    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
                }
                console.log('Comment deleted successfully');
                updateCommentsDisplay();
            } catch (error) {
                console.error('Error deleting comment:', error.message);
                alert('Failed to delete comment: ' + error.message);
            }
        }

        async function updateCommentsDisplay() {
            console.log('Updating comments display');
            const itemId = getItemId();
            const commentsDisplay = document.querySelector('.commentsDisplay');
            if (!itemId || !commentsDisplay) {
                console.log('Missing itemId or commentsDisplay:', { itemId, commentsDisplay });
                return;
            }

            try {
                const url = `${backendUrl}/comments/${itemId}`;
                console.log('Fetching comments from:', url);
                const response = await fetch(url);
                if (!response.ok) {
                    console.error('Fetch comments failed:', `HTTP ${response.status}`);
                    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
                }
                const comments = await response.json();
                console.log('Comments received:', comments);
                commentsDisplay.innerHTML = '';
                if (comments.length > 0) {
                    comments.forEach(comment => {
                        const commentDiv = document.createElement('div');
                        commentDiv.style.cssText = 'margin-bottom: 8px; display: flex; align-items: flex-start;';
                        commentDiv.innerHTML = `
                            <div style="flex: 1;">
                                <strong style="display: block; margin-bottom: 4px;">${comment.username}</strong>
                                <p>${comment.comment}</p>
                            </div>
                        `;
                        if (comment.userId === userId || adminUserIds.includes(userId)) {
                            const buttonGroup = document.createElement('div');
                            buttonGroup.style.cssText = 'margin-left: 10px; display: flex; flex-direction: column; gap: 4px;';
                            const editButton = document.createElement('button');
                            editButton.textContent = 'Edit';
                            editButton.style.cssText = `
                                background: #2196F3;
                                color: white;
                                border: none;
                                padding: 4px 8px;
                                border-radius: 4px;
                                cursor: pointer;
                            `;
                            editButton.addEventListener('click', () => {
                                console.log('Edit button clicked for comment:', comment.id);
                                const newComment = prompt('Edit your comment:', comment.comment);
                                if (newComment && newComment.trim()) {
                                    editComment(comment.id, newComment.trim());
                                }
                            });
                            const deleteButton = document.createElement('button');
                            deleteButton.textContent = 'Delete';
                            deleteButton.style.cssText = `
                                background: #ff4444;
                                color: white;
                                border: none;
                                padding: 4px 8px;
                                border-radius: 4px;
                                cursor: pointer;
                            `;
                            deleteButton.addEventListener('click', () => {
                                console.log('Delete button clicked for comment:', comment.id);
                                if (confirm('Are you sure you want to delete this comment?')) {
                                    deleteComment(comment.id);
                                }
                            });
                            buttonGroup.appendChild(editButton);
                            buttonGroup.appendChild(deleteButton);
                            commentDiv.appendChild(buttonGroup);
                        }
                        commentsDisplay.appendChild(commentDiv);
                    });
                } else {
                    console.log('No comments to display');
                    commentsDisplay.innerHTML = '<p>No comments yet.</p>';
                }
            } catch (error) {
                console.error('Error fetching comments:', error.message);
                commentsDisplay.innerHTML = '<p>Failed to load comments: ' + error.message + '</p>';
            }
        }

        async function toggleRecommendation() {
            console.log('Toggling recommendation for userId:', userId);
            const itemId = getItemId();
            if (!itemId) {
                console.log('No itemId found');
                alert('Cannot recommend: Item not found');
                return;
            }
            if (!userId) {
                console.log('No userId found in credentials');
                alert('Please log in to recommend');
                return;
            }

            try {
                const url = `${backendUrl}/recommend`;
                console.log('Sending recommendation toggle:', url, { userId, itemId });
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, itemId })
                });
                if (!response.ok) {
                    console.error('Recommendation toggle failed:', `HTTP ${response.status}`);
                    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
                }
                const result = await response.json();
                console.log('Toggle response:', result);
                updateRecommendationDisplay();
            } catch (error) {
                console.error('Error toggling recommendation:', error.message);
                alert('Failed to toggle recommendation: ' + error.message);
            }
        }

        async function updateRecommendationDisplay() {
            console.log('Updating recommendation display');
            const itemId = getItemId();
            const displayArea = document.querySelector('.recommendationArea');
            if (!itemId || !displayArea) {
                console.log('Missing itemId or displayArea:', { itemId, displayArea });
                return;
            }

            try {
                const url = `${backendUrl}/recommendations/${itemId}`;
                console.log('Fetching recommendations from:', url);
                const response = await fetch(url);
                if (!response.ok) {
                    console.error('Fetch recommendations failed:', `HTTP ${response.status}`);
                    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
                }
                const recommendations = await response.json();
                console.log('Recommendations received:', recommendations);
                
                if (recommendations.length > 0) {
                    const userList = recommendations.map(r => r.username).join(', ');
                    displayArea.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span class="material-icons" style="color: #667eea;">thumb_up</span>
                            <strong>Recommandé par :</strong> ${userList}
                            <span style="margin-left: auto; background: #667eea; color: white; padding: 4px 12px; border-radius: 16px; font-size: 0.85rem;">
                                ${recommendations.length} ${recommendations.length > 1 ? 'votes' : 'vote'}
                            </span>
                        </div>
                    `;
                } else {
                    displayArea.innerHTML = '';
                }
            } catch (error) {
                console.error('Error fetching recommendations:', error.message);
                displayArea.textContent = 'Failed to load recommendations: ' + error.message;
            }
        }

        function getItemId() {
            const url = window.location.href;
            const match = url.match(/details\?id=([0-9a-f]{32})/);
            if (match) {
                return match[1];
            }
            return null;
        }

        function addButtons() {
            const playButton = document.querySelector('.mainDetailButtons .btnPlaystate, .detailButton-container button[data-id="play"]');
            const castButton = document.querySelector('.headerRight .headerCastButton, .headerTabs button[data-id="cast"], .mainDrawer-scrollContainer .castButton');

            if (playButton) {
                createRecommendButton(playButton);
            }

            if (castButton) {
                createRecommendationsButton(castButton);
                createAdminButton(castButton);
            }
        }

        function createRecommendationsButton(castButton) {
            console.log('Attempting to create Recommendations button');
            if (!castButton || !castButton.parentNode) {
                console.log('Cast button or its parent not found');
            }
            if (document.querySelector('.btnRecommendations')) {
                console.log('Recommendations button already exists');
                return;
            }

            console.log('Creating Recommendations button');
            recommendationsButton = document.createElement('button');
            recommendationsButton.setAttribute('is', 'paper-icon-button-light');
            recommendationsButton.className = 'headerButton btnRecommendations emby-button paper-icon-button-light';
            recommendationsButton.title = 'Recommendations';
            recommendationsButton.innerHTML = '<span class="material-icons star" aria-hidden="true"></span>';
            recommendationsButton.style.backgroundColor = '#00ff0000';
            try {
                const castWidth = parseFloat(getComputedStyle(castButton).width) || 40;
                const castHeight = parseFloat(getComputedStyle(castButton).height) || 40;
                recommendationsButton.style.width = `${castWidth * 1.2}px`;
                recommendationsButton.style.height = `${castHeight * 1.2}px`;
            } catch (error) {
                console.error('Error setting Recommendations button size:', error.message);
                recommendationsButton.style.width = '48px';
                recommendationsButton.style.height = '48px';
            }

            try {
                castButton.parentNode.insertBefore(recommendationsButton, castButton);
                console.log('Recommendations button inserted');
            } catch (error) {
                console.error('Error inserting Recommendations button:', error.message);
                const topBar = document.querySelector('.headerRight, .headerTabs, .mainDrawer-scrollContainer, .header');
                if (topBar) {
                    topBar.prepend(recommendationsButton);
                    console.log('Recommendations button appended to topBar');
                }
            }

            recommendationsButton.addEventListener('click', () => {
                console.log('Recommendations button clicked at ' + new Date().toISOString());
                showRecommendationsOverlay();
            });
        }

        function createAdminButton(castButton) {
            console.log('Attempting to create Admin button for userId:', state.userId);
            if (!config.adminUserIds.includes(state.userId)) {
                console.log('User is not an admin, skipping admin button');
                return;
            }
            if (document.querySelector('.btnAdmin')) {
                console.log('Admin button already exists');
                return;
            }

            console.log('Creating Admin button');
            const adminButton = document.createElement('button');
            adminButton.setAttribute('is', 'paper-icon-button-light');
            adminButton.className = 'headerButton btnAdmin emby-button paper-icon-button-light';
            adminButton.title = 'Admin Settings';
            adminButton.innerHTML = '<span class="material-icons settings" aria-hidden="true"></span>';
            adminButton.style.backgroundColor = '#00ff0000';

            const castButtonSize = castButton ? parseFloat(getComputedStyle(castButton).width) || 40 : 40;
            adminButton.style.width = `${castButtonSize * 1.2}px`;
            adminButton.style.height = `${castButtonSize * 1.2}px`;

            if (castButton && castButton.parentNode) {
                castButton.parentNode.insertBefore(adminButton, castButton);
            } else {
                const topBar = document.querySelector('.headerRight, .headerTabs, .mainDrawer-scrollContainer, .header');
                if (topBar) {
                    topBar.prepend(adminButton);
                } else {
                    console.error('Jellyfin Updoot: Could not find a suitable place to add the admin button.');
                    return;
                }
            }

            adminButton.addEventListener('click', showAdminOverlay);
        }

        async function showRecommendationsOverlay() {
            console.log('Opening recommendations overlay for userId:', userId);
            
            // Créer l'overlay avec le nouveau design
            if (!overlay) {
                console.log('Creating recommendations overlay');
                overlay = document.createElement('div');
                overlay.className = 'updoot-overlay';
                document.body.appendChild(overlay);
            }

            // Vider et reconstruire le contenu
            overlay.innerHTML = `
                <button class="updoot-close-btn">
                    <span class="material-icons">close</span>
                </button>
                <div class="updoot-container">
                    <div class="updoot-header">
                        <h1>🎬 Recommandations Jellyfin</h1>
                    </div>
                    <div class="updoot-stats" id="updoot-stats">
                        <div class="updoot-stat-item">
                            <div class="updoot-stat-number">0</div>
                            <div class="updoot-stat-label">Total des recommandations</div>
                        </div>
                        <div class="updoot-stat-item">
                            <div class="updoot-stat-number">0</div>
                            <div class="updoot-stat-label">Médias recommandés</div>
                        </div>
                        <div class="updoot-stat-item">
                            <div class="updoot-stat-number">0</div>
                            <div class="updoot-stat-label">Utilisateurs actifs</div>
                        </div>
                    </div>
                    <div class="updoot-loading" id="updoot-loading">
                        <div class="updoot-loading-spinner"></div>
                        <p>Chargement des recommandations...</p>
                    </div>
                    <div class="updoot-grid" id="updoot-grid" style="display: none;"></div>
                    <div class="updoot-no-results" id="updoot-no-results" style="display: none;">
                        <h3>Aucune recommandation</h3>
                        <p>Soyez le premier à recommander du contenu !</p>
                    </div>
                </div>
            `;

            // Ajouter les event listeners
            const closeBtn = overlay.querySelector('.updoot-close-btn');
            closeBtn.addEventListener('click', () => {
                console.log('Closing recommendations overlay');
                overlay.style.display = 'none';
            });

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    console.log('Recommendations overlay clicked outside, closing');
                    overlay.style.display = 'none';
                }
            });

            overlay.style.display = 'block';

            try {
                const url = `${backendUrl}/recommendations`;
                console.log('Fetching all recommendations from:', url);
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Emby-Token': apiKey
                    }
                });
                
                if (!response.ok) {
                    console.error('Fetch recommendations failed:', `HTTP ${response.status}`);
                    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
                }
                
                const recommendations = await response.json();
                console.log('Recommendations received:', recommendations);

                // Masquer le loading
                document.getElementById('updoot-loading').style.display = 'none';

                if (!Array.isArray(recommendations) || recommendations.length === 0) {
                    console.log('No recommendations available');
                    document.getElementById('updoot-no-results').style.display = 'block';
                    return;
                }

                // Grouper par item
                const groupedByItem = {};
                const uniqueUsers = new Set();
                
                recommendations.forEach(rec => {
                    if (!groupedByItem[rec.itemId]) {
                        groupedByItem[rec.itemId] = [];
                    }
                    groupedByItem[rec.itemId].push(rec.username);
                    uniqueUsers.add(rec.userId);
                });

                // Mettre à jour les statistiques
                const stats = document.getElementById('updoot-stats');
                const statNumbers = stats.querySelectorAll('.updoot-stat-number');
                statNumbers[0].textContent = recommendations.length;
                statNumbers[1].textContent = Object.keys(groupedByItem).length;
                statNumbers[2].textContent = uniqueUsers.size;

                // Afficher la grille
                const grid = document.getElementById('updoot-grid');
                grid.innerHTML = '';
                grid.style.display = 'grid';

                // Trier par nombre de recommandations
                const sortedItems = Object.entries(groupedByItem)
                    .sort(([, a], [, b]) => b.length - a.length);

                // Créer les cartes
                for (const [itemId, usernames] of sortedItems) {
                    console.log('Fetching item details for itemId:', itemId);
                    const itemDetails = await fetchItemDetails(itemId);
                    if (!itemDetails) {
                        console.log('Skipping itemId due to missing details:', itemId);
                        continue;
                    }

                    const card = document.createElement('div');
                    card.className = 'updoot-card';
                    card.addEventListener('click', () => {
                        console.log('Navigating to item:', itemId);
                        window.location.href = `/web/index.html#!/details?id=${itemId}`;
                        overlay.style.display = 'none';
                    });

                    const imageUrl = itemDetails.ImageTags?.Primary
                        ? `${serverUrl}/Items/${itemId}/Images/Primary?api_key=${apiKey}`
                        : itemDetails.ImageTags?.Backdrop
                        ? `${serverUrl}/Items/${itemId}/Images/Backdrop?api_key=${apiKey}`
                        : '';

                    // Déterminer le type de média
                    const mediaType = itemDetails.Type || 'Media';
                    const year = itemDetails.ProductionYear || '';

                    card.innerHTML = `
                        ${imageUrl ? `<img src="${imageUrl}" class="updoot-card-image" alt="${itemDetails.Name || 'Item'}">` : '<div class="updoot-card-image" style="display: flex; align-items: center; justify-content: center; font-size: 3rem; color: #667eea;">🎬</div>'}
                        <div class="updoot-card-content">
                            <h3 class="updoot-card-title">${itemDetails.Name || 'Unknown'}</h3>
                            <div class="updoot-card-meta">
                                <span class="updoot-card-type">${mediaType} ${year ? `(${year})` : ''}</span>
                                <span class="updoot-vote-count">
                                    <span class="material-icons" style="font-size: 16px;">thumb_up</span>
                                    ${usernames.length}
                                </span>
                            </div>
                            ${itemDetails.Overview ? `<p class="updoot-card-overview">${itemDetails.Overview}</p>` : ''}
                            <div class="updoot-users-list">
                                <div class="updoot-users-title">Recommandé par :</div>
                                <div class="updoot-user-chips">
                                    ${usernames.slice(0, 5).map(username => `
                                        <div class="updoot-user-chip">
                                            <span class="updoot-user-avatar">${username.charAt(0).toUpperCase()}</span>
                                            ${username}
                                        </div>
                                    `).join('')}
                                    ${usernames.length > 5 ? `<div class="updoot-user-chip">+${usernames.length - 5} autres</div>` : ''}
                                </div>
                            </div>
                        </div>
                    `;

                    grid.appendChild(card);
                }

                console.log('Recommendations overlay displayed with', sortedItems.length, 'items');
            } catch (error) {
                console.error('Error fetching recommendations:', error.message);
                document.getElementById('updoot-loading').innerHTML = `
                    <p style="color: #ef4444;">Erreur lors du chargement des recommandations : ${error.message}</p>
                `;
            }
        }

        async function showAdminOverlay() {
            if (!config.adminUserIds.includes(state.userId)) {
                alert('Access denied: Admin privileges required');
                return;
            }

            if (!state.adminOverlay) {
                state.adminOverlay = document.createElement('div');
                state.adminOverlay.className = 'updoot-overlay';
                document.body.appendChild(state.adminOverlay);
            }

            state.adminOverlay.innerHTML = `
                <button class="updoot-close-btn">
                    <span class="material-icons">close</span>
                </button>
                <div class="updoot-container">
                    <h2>Admin Settings</h2>
                    </div>
            `;

            const closeButton = state.adminOverlay.querySelector('.updoot-close-btn');
            closeButton.addEventListener('click', () => {
                state.adminOverlay.style.display = 'none';
            });

            state.adminOverlay.style.display = 'block';

            try {
                const [settings, comments] = await Promise.all([
                    fetch(`${state.backendUrl}/admin/settings`).then(res => res.json()),
                    fetch(`${state.backendUrl}/admin/comments`).then(res => res.json())
                ]);

                renderAdminSettings(settings);
                renderAdminComments(comments);

            } catch (error) {
                console.error('Jellyfin Updoot: Error loading admin data:', error);
                state.adminOverlay.querySelector('.updoot-container').innerHTML += '<p>Failed to load admin data.</p>';
            }
        }

        function renderAdminSettings(settings) {
            // ...
        }

        function renderAdminComments(comments) {
            // ...
        }

        function cleanupExistingElements() {
            const selectors = ['.btnRecommend', '.btnRecommendations', '.btnAdmin', '.recommendationArea', '.commentsSection', '.updoot-overlay'];
            selectors.forEach(selector => {
                document.querySelectorAll(selector).forEach(el => el.remove());
            });
        }

        function setupNavigationListener() {
            const observer = new MutationObserver(() => {
                if (window.location.href !== state.lastUrl) {
                    state.lastUrl = window.location.href;
                    run();
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
})();