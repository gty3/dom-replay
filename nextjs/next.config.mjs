const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/cl', // Replace with your default symbol page
        permanent: true,
      },
    ];
  },
};

export default nextConfig;