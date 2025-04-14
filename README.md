This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, Install the dependencies run the development server:

```bash

npm install
npm run dev
# or
yarn install
yarn dev
# or
pnpm install
pnpm dev
# or
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.


### Run Flask Server

> If the `env` folder is already present in `api/` directory, do delete it first

To run the flask server, first activate the virtual environment and install dependencies

```
python3 venv env
source venv/bin/activate
```
Once, the envireonment is activate, install the dependencies

```
pip install -r requirements.txt
```
After that, run:
```
python api.py
```
The flask server will run on http://localhost:5000
