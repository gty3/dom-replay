const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/CL', // Replace with your default symbol page
        permanent: true,
      },
    ];
  },
};

export default nextConfig;