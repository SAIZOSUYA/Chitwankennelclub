module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const testimonials = [
    { id: 1, quote: "I got my Rottweiler puppy from Chitwan Kennel Club 6 months ago. The puppy arrived healthy, fully vaccinated, and extremely well-socialized. Dr. Kamala and the team at Gautam Chowk are always available whenever I need advice!", author: "Sujan Shrestha", location: "Bharatpur-10, Chitwan" },
    { id: 2, quote: "The best veterinary clinic and kennel in Bharatpur! They performed minor ear care surgery on my German Shepherd with utmost precision and tender loving care. Highly recommend to all pet owners in Nepal.", author: "Aakriti Gurung", location: "Narayangarh, Chitwan" },
    { id: 3, quote: "Finding purebred, ethically raised Golden Retrievers in Nepal used to be tough. Chitwan Kennel Club provided full vaccination records, microchip details, and genuine care. My dog Bruno is the joy of our family!", author: "Rohan Pokharel", location: "Gaindakot, Nawalpur" },
    { id: 4, quote: "Outstanding boarding and dog training service! Left my Beagle for 10 days while traveling to Kathmandu, and he was returned clean, happy, and well-exercised.", author: "Deepak Karki", location: "Bharatpur-7, Chitwan" }
  ];
  res.status(200).json({ success: true, testimonials });
};
