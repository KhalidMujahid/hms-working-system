CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'doctor', 'nurse', 'lab', 'pharmacist', 'receptionist', 'patient') NOT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  dob DATE,
  gender ENUM('male', 'female', 'other'),
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dispensed_medications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  medication_name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100) NOT NULL,
  dispensed_by INT NOT NULL,
  dispensed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (dispensed_by) REFERENCES users(id) ON DELETE SET NULL
);


CREATE TABLE consultations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  notes TEXT,
  diagnosis TEXT,
  prescribed_medication TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE lab_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  requested_by INT NOT NULL,
  test_type VARCHAR(100) NOT NULL,
  result TEXT,
  status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE prescriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  medication TEXT NOT NULL,
  dosage TEXT,
  instructions TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE billings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status ENUM('Paid', 'Pending') DEFAULT 'Pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

CREATE TABLE appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT,
  appointment_date DATE
);

CREATE TABLE logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action TEXT,
  log_type ENUM('info', 'warning', 'error'),
  log_time DATETIME
);