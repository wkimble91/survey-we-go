const express = require('express');
const app = express();
const port = 8383;
const { db } = require('./firebase')


app.use(express.static('public'));
app.use(express.json());

//routes HTTP verbs GET POST PUT DELETE
app.post('/', async (req, res) => {
    const { id, question, options } = req.body;

    if (!id || !question || options.length == 0) {
        res.status(400).send({ status: 'error' });
    }
    const docRef = db.collection('survey').doc('survey')
    const response = await docRef.set({
        [id]: {
            question,
            options: Array.from(options).reduce((acc, curr) => {
                return { ...acc, [curr]: 0 };
            }, {}),
        }
    }, { merge: true })

    res.redirect('/' + id);
});

app.get('/ids', async (req, res) => {
    const surveyRef = db.collection('survey').doc('survey');
    const data = await surveyRef.get();

    const surveys = data.data()
    res.status(200).send({ ids: Object.keys(surveys) });
});

app.get('/:id', (req, res) => {
    const { id } = req.params;
    try {
        return res
            .status(200)
            .sendFile('poll.html', { root: __dirname + '/public' });
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});

app.get('/data/:id', async (req, res) => {
    const { id } = req.params;

    const surveyRef = db.collection('survey').doc('survey');
    const data = await surveyRef.get();

    const surveys = data.data()
    if (!Object.keys(surveys).includes(id)) {
        return res.redirect('/')
    }
    res.status(200).send({ data: surveys[id] });
});

app.post('/vote', async (req, res) => {
    const { id, vote } = req.body
    const surveyRef = db.collection('survey').doc('survey');
    const surveys = await surveyRef.get();

    const data = surveys.data()
    data[id]['options'][vote] += 1
    const docRef = db.collection('survey').doc('survey')
    const response = await docRef.set({
        ...data
    }, { merge: true });
    res.sendStatus(200);
})

app.listen(port, () => console.log(`Server has started on port: ${port}`));
