<a name="readme-top"></a>


<!-- PROJECT LOGO -->
<div align="center">
<h3 align="center">InkSpace Backend</h3>

  <p align="center">
    REST API web server written in JavaScript utilizing Express.js and MongoDB
    <br />
    <a href="https://inkspace-alpha.vercel.app">View Demo</a>
    ·
    <a href="https://github.com/andriinero/inkspace">Frontend</a>
    ·
    <a href="https://github.com/andriinero/inkspace_backend/issues/new">Report Bug</a>
    ·
    <a href="https://github.com/andriinero/inkspace_backend/issues/new">Suggestion</a>  </p>
</div>


<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#features">Features</a></li>
        <li><a href="#api-endpoints">API Endpoints</a></li>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#contributing">Contributing</a></li>
  </ol>
</details>


<!-- ABOUT THE PROJECT -->
## About The Project
### Features
- Users: authentication and authorization are implemented to manage users
- Authors: read public user data
- Profile: update and delete profile details
- Blog Posts: create, read, update, and delete blog posts
- Comments: create, read, update, and delete blog post comments
- Likes: update like blog post likes
- Topics: create, read, update, and delete topics
- Images: create, read, update, and delete images

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### API Endpoints
Note that some endpoints may require proper authentication or authorization.

#### Authentication Endpoints
- GET &emsp;&emsp;&emsp;`/api/auth/login`
- POST &emsp;&emsp; `/api/auth/login`
- POST &emsp;&emsp; `/api/auth/sign-up`

#### Author Endpoints

- GET  &emsp;&emsp; `/api/authors`
- GET  &emsp;&emsp; `/api/authors/:userid`

#### Profile Endpoints
- Profile
  - GET &emsp;&emsp; `/api/profile`
  - PUT &emsp;&emsp; `/api/profile`
  - DELETE &nbsp;`/api/profile/:userid`
- Password
  - PUT &emsp;&emsp; `/api/profile/password`
- Profile Image
  - PUT &emsp;&emsp; `/api/profile/image`
- Bookmarks
  - GET &emsp;&emsp; `/api/profile/bookmarks`
  - POST &emsp; `/api/profile/bookmarks`
  - DELETE &nbsp;`/api/profile/boormarks/:postid`
- Ignored Posts
  - GET &emsp;&emsp; `/api/ignored-posts`
  - POST &emsp; `/api/ignored-posts`
  - DELETE &nbsp;`/api/ignored-posts/:postid`
- Ignored Users
  - GET &emsp;&emsp; `/api/ignored-users`
  - POST &emsp; `/api/ignored-users`
  - DELETE &nbsp;`/api/ignored-users/:userid`
- Ignored Topics
  - GET &emsp;&emsp; `/api/ignored-topics`
  - POST &emsp; `/api/ignored-topics`
  - DELETE &nbsp;`/api/ignored-topics/:userid`
- Followed Users
  - GET &emsp;&emsp; `/api/followed-users`
  - POST &emsp; `/api/followed-users`
  - DELETE &nbsp;`/api/followed-users/:userid`
- Users following
  - GET &emsp;&emsp; `/api/users-following`

#### Blog Post Endpoints
- Posts
  - GET &emsp;&emsp; `/api/posts`
  - GET &emsp;&emsp; `/api/posts/:postid`
  - POST &emsp; `/api/posts`
  - PUT &emsp;&emsp; `/api/posts/:postid`
  - DELETE &nbsp;`/api/posts/:postid`
- Comments
  - GET &emsp;&emsp; `/api/posts/:postid/comments`
  - POST &emsp; `/api/posts/:postid/comments`
- Likes
  - GET &emsp;&emsp; `/api/posts/:postid/comments`
  - PUT &emsp;&emsp; `/api/posts/:posid/comments`

#### Comment Endpoints

- GET &emsp;&emsp; `/api/comments/:postid`
- PUT &emsp;&emsp; `/api/comments/:postid`
- DELETE &nbsp;`/api/comments/:postid`
#### Topic Endpoints
- GET &emsp;&emsp; `/api/topics`
- GET &emsp;&emsp; `/api/topics/:postid`
- POST &emsp; `/api/topics`
- PUT &emsp;&emsp; `/api/topics/:postid`
- DELETE &nbsp;`/api/topics/:postid`

#### Image Endpoints
- GET &emsp;&emsp; `/api/images`
- GET &emsp;&emsp; `/api/images/:imageid`
- POST &emsp; `/api/images`
- PUT &emsp;&emsp; `/api/images/:imageid`
- DELETE &nbsp;`/api/images/:imageid`

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With
- [![Neovim][Neovim]][Neovim-url]
- [![JavaScript][JavaScript]][JavaScript-url]
- [![Node.js][NodeJS]][NodeJS-url]
- [![Express.js][Express]][Express-url]
- [![MongoDB][MongoDB]][MongoDB-url]
- [![JWT][JWT]][JWT-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- GETTING STARTED -->

## Getting Started
To get a local copy up and running follow these example steps.
### Prerequisites
To run this server, you'll need your own Atlas account and database connection string, as well as NodeJS installed on your machine.

You can create and set up your own account at [MongoDB Atlas](https://www.mongodb.com/en-us/cloud/atlas/register) official website. Note that while Atlas may offer you paid plan, the free tier cluster should be more than enough for development purposes.
As for NodeJS you can visit [NodeJS installation guide](https://nodejs.org/en/download/package-manager) on the official website.

### Installation
1. Clone the repo
   ```sh
   git clone https://github.com/andriinero/inkspace_backend.git
   ```
2. Create `.env` file in your project's root directory and paste the following
   ```sh
    NODE_ENV=development
    HOSTNAME=localhost
    PORT=3000
    # connection string is very important
    MONGODB_URI=<YOUR_ALTLAS_CONNECTION_STRING>
    JWT_SECRET=SECRET
    JWT_EXP=100000
    BCRYPT_SALT_VALUE=1
    MAX_DOCS_PER_FETCH=25
   ```
    *NOTE: you can omit angle brackets and delete the comments*

3. Install NPM packages
   ```sh
   npm install
   ```
4. After installing packages you can start your local server
   ```sh
   npm run dev
   ```
   
<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- CONTRIBUTING -->

## Contributing
Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- MARKDOWN LINKS & IMAGES -->
[Neovim]: https://img.shields.io/badge/NeoVim-%2357A143.svg?&style=for-the-badge&logo=neovim&logoColor=white
[Neovim-url]: https://neovim.io/
[JavaScript]: https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E
[JavaScript-url]: https://developer.mozilla.org/en-US/docs/Web/JavaScript
[JWT]: https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens
[JWT-url]: https://jwt.io/introduction
[NodeJS]: https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white
[NodeJS-url]: https://nodejs.org/
[Express]: https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB
[Express-url]: https://expressjs.com/
[MongoDB]: https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white
[MongoDB-url]: https://www.mongodb.com/
