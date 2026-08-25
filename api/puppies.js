module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const puppies = [
    { id: 1, puppy_id: '1', name: 'Rottweiler', breed: 'Rottweiler', gender: 'Male & Female', category: 'guard large', age: '8 Weeks Old', tag: 'Champion Bloodline', specs: 'Dewormed, 1st Vet Shot, KCI Registered', desc: 'Loyal, highly trainable, powerful guard dog with confident temperament.', status: 'Available in Kennel', image_url: 'images/rottweiler_puppy.jpg' },
    { id: 2, puppy_id: '2', name: 'German Shepherd', breed: 'German Shepherd', gender: 'Male & Female', category: 'guard large', age: '7 Weeks Old', tag: 'Heavy Bone Line', specs: 'Parvo Vaccinated, Microchipped, Show Line', desc: 'Intelligent, protective, and agile companion ideal for families and security.', status: 'Available in Kennel', image_url: 'images/german_shepherd_puppy.jpg' },
    { id: 3, puppy_id: '3', name: 'Golden Retriever', breed: 'Golden Retriever', gender: 'Female', category: 'family large', age: '9 Weeks Old', tag: 'Super Gentle', specs: 'Fully Vaccinated, Vet Certified, Playful', desc: 'Extremely friendly, gentle with kids, plush cream-golden coat.', status: 'Available in Kennel', image_url: 'images/golden_retriever_puppy.jpg' },
    { id: 4, puppy_id: '4', name: 'Beagle (Tricolor)', breed: 'Beagle', gender: 'Male', category: 'family medium', age: '8 Weeks Old', tag: 'Compact & Energetic', specs: 'Dewormed, Active, Socialized', desc: 'Curious scent hound, compact size, fantastic for apartment or home living.', status: 'Available in Kennel', image_url: 'images/beagle_puppy.jpg' },
    { id: 5, puppy_id: '5', name: 'Labrador Retriever', breed: 'Labrador Retriever', gender: 'Male & Female', category: 'family large', age: '7 Weeks Old', tag: 'Rare Chocolate Coat', specs: 'First Vaccination, Pedigree Parent', desc: 'High energy, eager to please, loving family dog with athletic build.', status: 'Available in Kennel', image_url: 'images/labrador_puppy.jpg' },
    { id: 6, puppy_id: '6', name: 'Siberian Husky', breed: 'Siberian Husky', gender: 'Female', category: 'guard large', age: '9 Weeks Old', tag: 'Blue Eyes', specs: 'Vaccinated, Dewormed, Show Quality', desc: 'Stunning thick double coat, striking blue eyes, and vocal charismatic personality.', status: 'Available in Kennel', image_url: 'images/husky_puppy.jpg' }
  ];
  res.status(200).json({ success: true, puppies });
};
