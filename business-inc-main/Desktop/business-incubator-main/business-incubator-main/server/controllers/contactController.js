const ContactMessage = require('../models/ContactMessage');

exports.createContactMessage = async (req, res, next) => {
  try {
    const { name, email, inquiryType, subject, message } = req.body;

    const contactMessage = await ContactMessage.create({
      name,
      email,
      inquiryType,
      subject,
      message,
    });

    res.status(201).json({
      message: 'Contact message received',
      contactMessage: {
        id: contactMessage._id,
        status: contactMessage.status,
        createdAt: contactMessage.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getContactMessages = async (req, res, next) => {
  try {
    const contactMessages = await ContactMessage.find().sort({ createdAt: -1 }).limit(100);
    res.status(200).json({ contactMessages });
  } catch (error) {
    next(error);
  }
};

exports.updateContactMessageStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['new', 'reviewed', 'closed'].includes(status)) {
      return res.status(400).json({ message: 'status must be new, reviewed, or closed' });
    }

    const contactMessage = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!contactMessage) {
      return res.status(404).json({ message: 'Contact message not found' });
    }

    res.status(200).json({ contactMessage });
  } catch (error) {
    next(error);
  }
};
