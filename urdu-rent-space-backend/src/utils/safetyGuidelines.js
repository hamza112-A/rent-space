// Category-specific safety guidelines and disclaimers templates

const getSafetyGuidelinesForCategory = (category) => {
  const guidelines = {
    vehicles: [
      { title: 'Valid License Required', description: 'Ensure you have a valid driving license for the vehicle type', icon: '🪪', mandatory: true },
      { title: 'Insurance Coverage', description: 'Verify insurance coverage before driving', icon: '🛡️', mandatory: true },
      { title: 'Fuel Policy', description: 'Return vehicle with the same fuel level as pickup', icon: '⛽', mandatory: false },
      { title: 'Speed Limits', description: 'Always follow traffic rules and speed limits', icon: '🚦', mandatory: true },
      { title: 'Emergency Kit', description: 'Check for emergency kit, spare tire, and tools', icon: '🔧', mandatory: false }
    ],
    property: [
      { title: 'No Smoking', description: 'Smoking is strictly prohibited indoors', icon: '🚭', mandatory: true },
      { title: 'Guest Limit', description: 'Respect the maximum guest capacity', icon: '👥', mandatory: true },
      { title: 'Quiet Hours', description: 'Maintain quiet hours from 10 PM to 8 AM', icon: '🔇', mandatory: true },
      { title: 'Emergency Exits', description: 'Familiarize yourself with emergency exits and fire extinguisher locations', icon: '🚪', mandatory: true },
      { title: 'Utilities', description: 'Report any issues with water, electricity, or gas immediately', icon: '💡', mandatory: false }
    ],
    equipment: [
      { title: 'Safety Gear', description: 'Use appropriate safety gear (helmet, gloves, goggles)', icon: '⛑️', mandatory: true },
      { title: 'Read Manual', description: 'Read instruction manual before operation', icon: '📖', mandatory: true },
      { title: 'Supervision', description: 'Use equipment under proper supervision if inexperienced', icon: '👨‍🏫', mandatory: false },
      { title: 'Maintenance Check', description: 'Inspect equipment before use for any defects', icon: '🔍', mandatory: true },
      { title: 'Proper Storage', description: 'Store equipment properly when not in use', icon: '📦', mandatory: false }
    ],
    boats: [
      { title: 'Life Jackets', description: 'Life jackets must be worn by all passengers', icon: '🦺', mandatory: true },
      { title: 'Boating License', description: 'Valid boating license required for operation', icon: '🪪', mandatory: true },
      { title: 'Weather Check', description: 'Check weather conditions before departure', icon: '🌤️', mandatory: true },
      { title: 'Emergency Signals', description: 'Know how to use flares and emergency signals', icon: '🚨', mandatory: true },
      { title: 'Capacity Limit', description: 'Do not exceed maximum passenger capacity', icon: '⚖️', mandatory: true }
    ],
    air: [
      { title: 'Pilot License', description: 'Valid pilot license and medical certificate required', icon: '🪪', mandatory: true },
      { title: 'Pre-flight Check', description: 'Complete thorough pre-flight inspection', icon: '✈️', mandatory: true },
      { title: 'Weather Briefing', description: 'Obtain weather briefing before flight', icon: '🌦️', mandatory: true },
      { title: 'Flight Plan', description: 'File flight plan with relevant authorities', icon: '📋', mandatory: true },
      { title: 'Emergency Procedures', description: 'Review emergency procedures before takeoff', icon: '🆘', mandatory: true }
    ],
    animals: [
      { title: 'Animal Handling', description: 'Handle animals gently and with care', icon: '🐾', mandatory: true },
      { title: 'Feeding Schedule', description: 'Follow prescribed feeding schedule and diet', icon: '🍖', mandatory: true },
      { title: 'Veterinary Care', description: 'Contact owner immediately if animal appears ill', icon: '🏥', mandatory: true },
      { title: 'Secure Environment', description: 'Ensure animal is kept in a secure environment', icon: '🏡', mandatory: true },
      { title: 'Exercise Needs', description: 'Provide adequate exercise and attention', icon: '🏃', mandatory: false }
    ],
    clothes: [
      { title: 'Cleaning Instructions', description: 'Follow care label instructions for cleaning', icon: '🧺', mandatory: true },
      { title: 'No Alterations', description: 'Do not alter or modify the clothing', icon: '✂️', mandatory: true },
      { title: 'Stain Removal', description: 'Address stains immediately to prevent permanent damage', icon: '🧼', mandatory: false },
      { title: 'Proper Storage', description: 'Store items properly on hangers or folded', icon: '👔', mandatory: false }
    ],
    services: [
      { title: 'Qualifications', description: 'Verify service provider qualifications and certifications', icon: '📜', mandatory: true },
      { title: 'Scope of Work', description: 'Clearly define scope of work and expectations', icon: '📝', mandatory: true },
      { title: 'Safety Protocol', description: 'Ensure safety protocols are followed during service', icon: '🦺', mandatory: true },
      { title: 'Insurance', description: 'Confirm service provider has liability insurance', icon: '🛡️', mandatory: false }
    ]
  };

  return guidelines[category] || [];
};

const getDefaultDisclaimers = (category) => {
  return {
    damage: {
      enabled: true,
      text: 'Renter is responsible for any damage caused during the rental period. A damage deposit may be required and will be refunded upon successful return of the item in its original condition.',
      insuranceRequired: ['vehicles', 'boats', 'air'].includes(category)
    },
    lostItems: {
      enabled: true,
      text: 'In case of lost or stolen items, the renter will be charged the full replacement value. Please ensure items are kept secure at all times.',
      reportingTimeframe: '24 hours'
    },
    liability: {
      enabled: true,
      text: 'The owner is not liable for any injuries, accidents, or damages that occur during the use of this item/service. Renters use at their own risk and should maintain appropriate insurance coverage.'
    },
    termsAccepted: {
      required: true,
      lastUpdated: new Date()
    }
  };
};

module.exports = {
  getSafetyGuidelinesForCategory,
  getDefaultDisclaimers
};
