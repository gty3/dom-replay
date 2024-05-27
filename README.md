<a name="readme-top"></a>


<!-- PROJECT LOGO -->
<br />
<div align="center">


<h3 align="center">DOM Replay</h3>

  <p align="center">
A depth of market tool to provide a replay of buy and sell orders for a specific financial instrument at particular times.
    <br />
    <a href="https://github.com/gty3/dom-replay"><strong>Read the guide »</strong></a>
    <br />
    <br />
    <a href="https://github.com/gty3/dom-replay">View Demo</a>
    ·
    <a href="https://github.com/gty3/dom-replay/issues/new?labels=bug&template=bug-report---.md">Report Bug</a>
    ·
    <a href="https://github.com/gty3/dom-replay/issues/new?labels=enhancement&template=feature-request---.md">Request Feature</a>
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
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
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

![Product Screenshot](https://raw.githubusercontent.com/gty3/dom-img/main/dom-wide2.png)

This project exists as a guide to getting into Rust

<p align="right">(<a href="#readme-top">back to top</a>)</p>



### Built With
* [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
* [![AWS](https://img.shields.io/badge/AWS-FF9900?style=for-the-badge&logo=amazon-aws)](https://aws.amazon.com/)
* [![Rust](https://img.shields.io/badge/Rust-DEA584?style=for-the-badge&logo=rust)](https://www.rust-lang.org/)
* [![Vite](https://img.shields.io/badge/Vite-42b883?style=for-the-badge&logo=vite)](https://vitejs.dev/)
* [![SST](https://img.shields.io/badge/SST-4A90E2?style=for-the-badge&logo=serverless-stack)](https://sst.dev/)
* ![Databento](https://img.shields.io/badge/Databento-DEA584?style=for-the-badge&logo=custom&logoColor=white)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- GETTING STARTED -->
## Getting Started

This project is built with SST.

### Prerequisites

This is an example of how to list things you need to use the software and how to install them.


### Installation

1. Get an API Key at [https://databento.com/](https://databento.com/)
2. Clone the repo
   ```sh
   git clone https://github.com/gty3/dom-replay.git
   ```
3. Install backend and frontend NPM packages
   ```sh
   pnpm install
   ```
4. Rename `env.example` to `.env` and add your DATABENTO_API_KEY

5. Run the backend locally
    ```sh
    npx sst dev
    ```

6. Run the frontend
    ```sh
    cd frontend
    pnpm dev
    ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- USAGE EXAMPLES -->
## Usage

Use this space to show useful examples of how a project can be used. Additional screenshots, code examples and demos work well in this space. You may also link to more resources.

_For more examples, please refer to the [Documentation](https://example.com)_

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ROADMAP -->
## Roadmap

- [ ] Move mbo and mbp10 value conversions from JS to Rust.
- [ ] Add an instrument/dataset/time modal to frontend to send to websocket. 


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



<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTACT -->
## Contact

Geoff Young - [@_gty__](https://x.com/_gty__)

Project Link: [https://github.com/gty3/dom-replay](https://github.com/gty3/dom-replay)

<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[contributors-shield]: https://img.shields.io/github/contributors/gty3/dom-replay.svg?style=for-the-badge
[contributors-url]: https://github.com/gty3/dom-replay/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/gty3/dom-replay.svg?style=for-the-badge
[forks-url]: https://github.com/gty3/dom-replay/network/members
[stars-shield]: https://img.shields.io/github/stars/gty3/dom-replay.svg?style=for-the-badge
[stars-url]: https://github.com/gty3/dom-replay/stargazers
[issues-shield]: https://img.shields.io/github/issues/gty3/dom-replay.svg?style=for-the-badge
[issues-url]: https://github.com/gty3/dom-replay/issues
[license-shield]: https://img.shields.io/github/license/gty3/dom-replay.svg?style=for-the-badge
[license-url]: https://github.com/gty3/dom-replay/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/linkedin_username
[product-screenshot]: https://github.com/gty3/dom-img/dom-wide2.png
[SST]: https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[SST-url]: https://sst.dev/
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[Vue.js]: https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vuedotjs&logoColor=4FC08D
[Vue-url]: https://vuejs.org/
[Angular.io]: https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white
[Angular-url]: https://angular.io/
[Svelte.dev]: https://img.shields.io/badge/Svelte-4A4A55?style=for-the-badge&logo=svelte&logoColor=FF3E00
[Svelte-url]: https://svelte.dev/
[Laravel.com]: https://img.shields.io/badge/Laravel-FF2D20?style=for-the-badge&logo=laravel&logoColor=white
[Laravel-url]: https://laravel.com
[Bootstrap.com]: https://img.shields.io/badge/Bootstrap-563D7C?style=for-the-badge&logo=bootstrap&logoColor=white
[Bootstrap-url]: https://getbootstrap.com
[JQuery.com]: https://img.shields.io/badge/jQuery-0769AD?style=for-the-badge&logo=jquery&logoColor=white
[JQuery-url]: https://jquery.com 