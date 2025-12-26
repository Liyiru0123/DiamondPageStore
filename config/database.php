<?php
/**
 * Database Configuration
 * Diamond Page Store - Database Implementation Assignment
 *
 * IMPORTANT: Update these values with your AWS RDS credentials
 */

class Database {
    // AWS RDS Database credentials - UPDATE THESE!
    private $host = "your-aws-rds-endpoint.amazonaws.com";  // AWS RDS endpoint
    private $db_name = "book_store";                     // Database name
    private $username = "root";                              // Database username
    private $password = "";                      // Database password
    private $port = "3306";

    public $conn;

    // Get database connection
    public function getConnection() {
        $this->conn = null;

        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host .
                ";port=" . $this->port .
                ";dbname=" . $this->db_name .
                ";charset=utf8mb4",
                $this->username,
                $this->password,
                array(
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                )
            );
        } catch(PDOException $e) {
            // Log error but don't expose details to client
            error_log("Database Connection Error: " . $e->getMessage());
            throw new Exception("Database connection failed");
        }

        return $this->conn;
    }
}

// Local development configuration (for XAMPP/WAMP)
class DatabaseLocal extends Database {
    private $host = "localhost";
    private $db_name = "book_store";
    private $username = "root";
    private $password = "";  // Default XAMPP password is empty
    private $port = "3306";

    public $conn;

    public function getConnection() {
        $this->conn = null;

        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host .
                ";port=" . $this->port .
                ";dbname=" . $this->db_name .
                ";charset=utf8mb4",
                $this->username,
                $this->password,
                array(
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                )
            );
        } catch(PDOException $e) {
            error_log("Database Connection Error: " . $e->getMessage());
            throw new Exception("Database connection failed: " . $e->getMessage());
        }

        return $this->conn;
    }
}

// Helper function to get appropriate database connection
function getDB() {
    $database = new DatabaseLocal();
    return $database->getConnection();
}
?>
