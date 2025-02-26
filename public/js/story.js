document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('like-btn').addEventListener('click', async function() {
        const storyId = this.getAttribute('data-id');
        const res = await fetch(`/stories/like/${storyId}`, { method: 'POST' });
        const data = await res.json();
        document.getElementById('like-count').innerText = data.likes;
        document.getElementById('dislike-count').innerText = data.dislikes;
    });

    document.getElementById('dislike-btn').addEventListener('click', async function() {
        const storyId = this.getAttribute('data-id');
        const res = await fetch(`/stories/dislike/${storyId}`, { method: 'POST' });
        const data = await res.json();
        document.getElementById('like-count').innerText = data.likes;
        document.getElementById('dislike-count').innerText = data.dislikes;
    });
});
document.addEventListener('DOMContentLoaded', () => {
    const commentForm = document.querySelector('form[action^="/stories/comment/"]');

    if (commentForm) {
        commentForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const storyId = this.action.split('/').pop();
            const text = this.querySelector('textarea[name="text"]').value;

            const res = await fetch(`/stories/comment/${storyId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            if (res.ok) {
                location.reload(); // Reload comments dynamically
            }
        });
    }
});
document.getElementById('sort-form').addEventListener('submit', function (e) {
    e.preventDefault(); 
    let sortBy = document.getElementById('sort').value;
    window.location.href = `/stories?sort=${sortBy}`; 
});
document.addEventListener('DOMContentLoaded', function () {
    let elems = document.querySelectorAll('select');
    M.FormSelect.init(elems);
});
document.getElementById('sortStories').addEventListener('change', function() {
    const selectedSort = this.value;
    window.location.href = `/stories?sort=${selectedSort}`;
});


