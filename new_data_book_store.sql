-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: book_store
-- ------------------------------------------------------
-- Server version	9.5.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

-- SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '85dc8b77-b958-11f0-938e-e86a642b8f60:1-217';

--
-- Table structure for table `announcements`
--

DROP TABLE IF EXISTS `announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcements` (
  `announcement_id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `content` varchar(255) NOT NULL,
  `publish_at` datetime NOT NULL,
  `expire_at` datetime DEFAULT NULL,
  PRIMARY KEY (`announcement_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcements`
--

LOCK TABLES `announcements` WRITE;
/*!40000 ALTER TABLE `announcements` DISABLE KEYS */;
INSERT INTO `announcements` VALUES (1,'Mid-Autumn Festival Promotion','To celebrate the Mid-Autumn Festival, all paperbacks are 20% off this week. Gold members enjoy an additional 10% discount.','2025-09-15 09:00:00','2025-09-22 23:59:59'),(2,'New Arrivals: Computer Science Classics','New computer science titles have arrived, including algorithms, operating systems, and AI-related books. Check them out in-store or online.','2025-09-20 10:00:00','0000-00-00 00:00:00'),(3,'Store Maintenance Notice','Our online store will undergo system maintenance on September 25 from 01:00 to 03:00. During this period, checkout services may be unavailable.','2025-09-25 12:00:00','2025-09-25 03:00:00'),(4,'Final Exam Season Reading Recommendations','To support students during the final exam season, we have curated a special list of recommended textbooks and reference books. Selected titles are available with limited-time discounts.','2025-10-05 10:00:00','2025-10-20 23:59:59'),(5,'Extended Opening Hours This Weekend','Our physical bookstore will extend opening hours this weekend, staying open until 10:00 PM on Saturday and Sunday. Welcome to visit and enjoy a quieter reading environment.','2025-10-12 08:00:00','2025-10-13 22:00:00'),(6,'New Year 2026 Promotion','To celebrate the New Year 2026, enjoy up to 25% off on selected books across all categories. Members can receive extra discounts during the promotion period. Happy New Year and happy reading!','2025-12-01 10:00:00','2026-01-07 23:59:59'),(7,'Spring 2026 Book Sale','Welcome the Spring 2026 season with our special book sale. Selected titles across literature, science, and technology are available with discounts of up to 20%. Members enjoy additional exclusive offers during the promotion.','2026-03-10 09:00:00','2026-03-24 23:59:59');
/*!40000 ALTER TABLE `announcements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `authors`
--

DROP TABLE IF EXISTS `authors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `authors` (
  `author_id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `country` varchar(50) NOT NULL,
  PRIMARY KEY (`author_id`)
) ENGINE=InnoDB AUTO_INCREMENT=85 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `authors`
--

LOCK TABLES `authors` WRITE;
/*!40000 ALTER TABLE `authors` DISABLE KEYS */;
INSERT INTO `authors` VALUES (1,'Cervantes','Miguel','Spain'),(2,'Tolstoy','Leo','Russia'),(3,'Dostoevsky','Fyodor','Russia'),(4,'Gogol','Nikolai','Russia'),(5,'Turgenev','Ivan','Russia'),(6,'Pushkin','Alexander','Russia'),(7,'Pasternak','Boris','Russia'),(8,'Bulgakov','Mikhail','Russia'),(9,'Solzhenitsyn','Aleksandr','Russia'),(10,'Chekhov','Anton','Russia'),(11,'Hugo','Victor','France'),(12,'Dumas','Alexandre','France'),(13,'Flaubert','Gustave','France'),(14,'Stendhal','Stendhal','France'),(15,'Zola','Emile','France'),(16,'Proust','Marcel','France'),(17,'Camus','Albert','France'),(18,'Voltaire','Voltaire','France'),(19,'Saint-Exupery','Antoine de','France'),(20,'Shakespeare','William','UK'),(21,'Austen','Jane','UK'),(22,'Bronte','Charlotte','UK'),(23,'Bronte','Emily','UK'),(24,'Dickens','Charles','UK'),(25,'Orwell','George','UK'),(26,'Huxley','Aldous','UK'),(27,'Shelley','Mary','UK'),(28,'Carroll','Lewis','UK'),(29,'Melville','Herman','USA'),(30,'Fitzgerald','F. Scott','USA'),(31,'Lee','Harper','USA'),(32,'Salinger','J. D.','USA'),(33,'Steinbeck','John','USA'),(34,'Hemingway','Ernest','USA'),(35,'Bradbury','Ray','USA'),(36,'Twain','Mark','USA'),(37,'Hawthorne','Nathaniel','USA'),(38,'Ellison','Ralph','USA'),(39,'Morrison','Toni','USA'),(40,'Faulkner','William','USA'),(41,'Montgomery','L. M.','Canada'),(42,'Atwood','Margaret','Canada'),(43,'Martel','Yann','Canada'),(44,'Ondaatje','Michael','Canada'),(45,'Davies','Robertson','Canada'),(46,'Alighieri','Dante','Italy'),(47,'Boccaccio','Giovanni','Italy'),(48,'Machiavelli','Niccolo','Italy'),(49,'Eco','Umberto','Italy'),(50,'Calvino','Italo','Italy'),(51,'Lampedusa','Giuseppe Tomasi di','Italy'),(52,'Manzoni','Alessandro','Italy'),(53,'Ariosto','Ludovico','Italy'),(54,'Murasaki','Shikibu','Japan'),(55,'Sei','Shonagon','Japan'),(56,'Natsume','Soseki','Japan'),(57,'Kawabata','Yasunari','Japan'),(58,'Mishima','Yukio','Japan'),(59,'Dazai','Osamu','Japan'),(60,'Abe','Kobo','Japan'),(61,'Endo','Shusaku','Japan'),(62,'Tanizaki','Junichiro','Japan'),(63,'Heo','Gyun','Korea'),(64,'Kim','Man-jung','Korea'),(65,'Anonymous','Anonymous','Korea'),(66,'Choi','In-hun','Korea'),(67,'Lee','Mun-yeol','Korea'),(68,'Shin','Kyung-sook','Korea'),(69,'Han','Kang','Korea'),(70,'Hwang','Sok-yong','Korea'),(71,'Park','Wan-suh','Korea'),(72,'Cho','Nam-joo','Korea'),(73,'Kim','So-wol','Korea'),(74,'Cao','Xueqin','China'),(75,'Wu','Cheng\'en','China'),(76,'Shi','Nai\'an','China'),(77,'Luo','Guanzhong','China'),(78,'Wu','Jingzi','China'),(79,'Pu','Songling','China'),(80,'Qian','Zhongshu','China'),(81,'Lu','Xun','China'),(82,'Shen','Congwen','China'),(83,'Lao','She','China'),(84,'Ba','Jin','China');
/*!40000 ALTER TABLE `authors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `book_authors`
--

DROP TABLE IF EXISTS `book_authors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `book_authors` (
  `author_id` int NOT NULL,
  `ISBN` char(13) NOT NULL,
  PRIMARY KEY (`author_id`,`ISBN`),
  KEY `fk_book_authors_authors1_idx` (`author_id`),
  KEY `fk_book_authors_books1_idx` (`ISBN`),
  CONSTRAINT `fk_book_authors_authors1` FOREIGN KEY (`author_id`) REFERENCES `authors` (`author_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_book_authors_books1` FOREIGN KEY (`ISBN`) REFERENCES `books` (`ISBN`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `book_authors`
--

LOCK TABLES `book_authors` WRITE;
/*!40000 ALTER TABLE `book_authors` DISABLE KEYS */;
INSERT INTO `book_authors` VALUES (2,'9782000000013'),(2,'9782000000014'),(3,'9782000000015'),(3,'9782000000016'),(3,'9782000000017'),(4,'9782000000018'),(5,'9782000000019'),(6,'9782000000020'),(7,'9782000000021'),(8,'9782000000022'),(9,'9782000000023'),(10,'9782000000024'),(11,'9782000000025'),(11,'9782000000026'),(12,'9782000000027'),(12,'9782000000028'),(13,'9782000000029'),(14,'9782000000030'),(15,'9782000000031'),(16,'9782000000032'),(17,'9782000000033'),(17,'9782000000034'),(18,'9782000000035'),(19,'9782000000036'),(20,'9782000000037'),(20,'9782000000038'),(20,'9782000000039'),(21,'9782000000040'),(21,'9782000000041'),(22,'9782000000042'),(23,'9782000000043'),(24,'9782000000044'),(24,'9782000000045'),(24,'9782000000046'),(25,'9782000000047'),(26,'9782000000048'),(27,'9782000000049'),(28,'9782000000050'),(29,'9782000000051'),(30,'9782000000052'),(31,'9782000000053'),(32,'9782000000054'),(33,'9782000000055'),(33,'9782000000056'),(34,'9782000000057'),(34,'9782000000058'),(35,'9782000000059'),(36,'9782000000060'),(37,'9782000000061'),(38,'9782000000062'),(39,'9782000000063'),(40,'9782000000064'),(41,'9782000000065'),(42,'9782000000066'),(42,'9782000000067'),(43,'9782000000068'),(44,'9782000000069'),(45,'9782000000070'),(46,'9782000000071'),(47,'9782000000072'),(48,'9782000000073'),(49,'9782000000074'),(50,'9782000000075'),(51,'9782000000076'),(52,'9782000000077'),(53,'9782000000078'),(54,'9782000000079'),(55,'9782000000080'),(56,'9782000000081'),(57,'9782000000082'),(58,'9782000000083'),(58,'9782000000084'),(59,'9782000000085'),(60,'9782000000086'),(61,'9782000000087'),(62,'9782000000088'),(63,'9782000000089'),(64,'9782000000090'),(65,'9782000000091'),(66,'9782000000092'),(67,'9782000000093'),(68,'9782000000094'),(69,'9782000000095'),(69,'9782000000096'),(70,'9782000000097'),(71,'9782000000098'),(72,'9782000000099'),(73,'9782000000100'),(74,'9782000000001'),(75,'9782000000002'),(76,'9782000000003'),(77,'9782000000004'),(78,'9782000000005'),(79,'9782000000006'),(80,'9782000000007'),(81,'9782000000008'),(82,'9782000000009'),(83,'9782000000010'),(83,'9782000000012'),(84,'9782000000011');
/*!40000 ALTER TABLE `book_authors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `book_categories`
--

DROP TABLE IF EXISTS `book_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `book_categories` (
  `category_id` int NOT NULL,
  `ISBN` char(13) NOT NULL,
  PRIMARY KEY (`category_id`,`ISBN`),
  KEY `fk_book_categories_catagories1_idx` (`category_id`),
  KEY `fk_book_categories_books1_idx` (`ISBN`),
  CONSTRAINT `fk_book_categories_books1` FOREIGN KEY (`ISBN`) REFERENCES `books` (`ISBN`) ON UPDATE CASCADE,
  CONSTRAINT `fk_book_categories_catagories1` FOREIGN KEY (`category_id`) REFERENCES `catagories` (`category_id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `book_categories`
--

LOCK TABLES `book_categories` WRITE;
/*!40000 ALTER TABLE `book_categories` DISABLE KEYS */;
INSERT INTO `book_categories` VALUES (1,'9782000000001'),(1,'9782000000002'),(1,'9782000000003'),(1,'9782000000004'),(1,'9782000000005'),(1,'9782000000007'),(1,'9782000000008'),(1,'9782000000009'),(1,'9782000000010'),(1,'9782000000011'),(1,'9782000000012'),(1,'9782000000013'),(1,'9782000000014'),(1,'9782000000015'),(1,'9782000000016'),(1,'9782000000017'),(1,'9782000000018'),(1,'9782000000019'),(1,'9782000000020'),(1,'9782000000021'),(1,'9782000000022'),(1,'9782000000023'),(1,'9782000000024'),(1,'9782000000025'),(1,'9782000000026'),(1,'9782000000027'),(1,'9782000000028'),(1,'9782000000029'),(1,'9782000000030'),(1,'9782000000031'),(1,'9782000000032'),(1,'9782000000033'),(1,'9782000000034'),(1,'9782000000035'),(1,'9782000000037'),(1,'9782000000038'),(1,'9782000000039'),(1,'9782000000040'),(1,'9782000000041'),(1,'9782000000043'),(1,'9782000000044'),(1,'9782000000045'),(1,'9782000000046'),(1,'9782000000047'),(1,'9782000000048'),(1,'9782000000051'),(1,'9782000000052'),(1,'9782000000053'),(1,'9782000000054'),(1,'9782000000055'),(1,'9782000000056'),(1,'9782000000057'),(1,'9782000000058'),(1,'9782000000059'),(1,'9782000000061'),(1,'9782000000062'),(1,'9782000000063'),(1,'9782000000064'),(1,'9782000000065'),(1,'9782000000066'),(1,'9782000000067'),(1,'9782000000068'),(1,'9782000000069'),(1,'9782000000070'),(1,'9782000000072'),(1,'9782000000074'),(1,'9782000000075'),(1,'9782000000076'),(1,'9782000000077'),(1,'9782000000079'),(1,'9782000000080'),(1,'9782000000081'),(1,'9782000000082'),(1,'9782000000083'),(1,'9782000000084'),(1,'9782000000085'),(1,'9782000000086'),(1,'9782000000087'),(1,'9782000000088'),(1,'9782000000089'),(1,'9782000000090'),(1,'9782000000091'),(1,'9782000000092'),(1,'9782000000093'),(1,'9782000000094'),(1,'9782000000095'),(1,'9782000000096'),(1,'9782000000097'),(1,'9782000000098'),(1,'9782000000099'),(1,'9782000000100'),(2,'9782000000001'),(2,'9782000000003'),(2,'9782000000004'),(2,'9782000000011'),(2,'9782000000013'),(2,'9782000000018'),(2,'9782000000019'),(2,'9782000000021'),(2,'9782000000023'),(2,'9782000000025'),(2,'9782000000026'),(2,'9782000000027'),(2,'9782000000028'),(2,'9782000000030'),(2,'9782000000031'),(2,'9782000000046'),(2,'9782000000055'),(2,'9782000000063'),(2,'9782000000067'),(2,'9782000000069'),(2,'9782000000074'),(2,'9782000000076'),(2,'9782000000077'),(2,'9782000000079'),(2,'9782000000087'),(2,'9782000000088'),(2,'9782000000096'),(2,'9782000000097'),(3,'9782000000001'),(3,'9782000000007'),(3,'9782000000008'),(3,'9782000000010'),(3,'9782000000011'),(3,'9782000000014'),(3,'9782000000015'),(3,'9782000000016'),(3,'9782000000017'),(3,'9782000000019'),(3,'9782000000023'),(3,'9782000000024'),(3,'9782000000025'),(3,'9782000000029'),(3,'9782000000030'),(3,'9782000000031'),(3,'9782000000032'),(3,'9782000000033'),(3,'9782000000034'),(3,'9782000000044'),(3,'9782000000045'),(3,'9782000000049'),(3,'9782000000053'),(3,'9782000000054'),(3,'9782000000055'),(3,'9782000000056'),(3,'9782000000057'),(3,'9782000000058'),(3,'9782000000061'),(3,'9782000000062'),(3,'9782000000063'),(3,'9782000000064'),(3,'9782000000066'),(3,'9782000000070'),(3,'9782000000076'),(3,'9782000000081'),(3,'9782000000083'),(3,'9782000000085'),(3,'9782000000088'),(3,'9782000000092'),(3,'9782000000094'),(3,'9782000000095'),(3,'9782000000096'),(3,'9782000000097'),(3,'9782000000098'),(3,'9782000000099'),(4,'9782000000015'),(4,'9782000000016'),(4,'9782000000017'),(4,'9782000000022'),(4,'9782000000033'),(4,'9782000000034'),(4,'9782000000037'),(4,'9782000000038'),(4,'9782000000039'),(4,'9782000000051'),(4,'9782000000081'),(4,'9782000000083'),(4,'9782000000085'),(4,'9782000000086'),(4,'9782000000087'),(4,'9782000000092'),(4,'9782000000095'),(5,'9782000000071'),(5,'9782000000078'),(6,'9782000000020'),(6,'9782000000071'),(6,'9782000000078'),(6,'9782000000100'),(7,'9782000000012'),(7,'9782000000024'),(7,'9782000000037'),(7,'9782000000038'),(7,'9782000000039'),(8,'9782000000005'),(8,'9782000000006'),(8,'9782000000008'),(8,'9782000000072'),(8,'9782000000080'),(8,'9782000000100'),(9,'9782000000073'),(9,'9782000000080'),(10,'9782000000073'),(11,'9782000000071'),(11,'9782000000073'),(14,'9782000000002'),(14,'9782000000003'),(14,'9782000000004'),(14,'9782000000013'),(14,'9782000000027'),(14,'9782000000028'),(14,'9782000000035'),(14,'9782000000046'),(14,'9782000000051'),(14,'9782000000060'),(14,'9782000000068'),(14,'9782000000089'),(15,'9782000000009'),(15,'9782000000014'),(15,'9782000000020'),(15,'9782000000021'),(15,'9782000000029'),(15,'9782000000036'),(15,'9782000000040'),(15,'9782000000041'),(15,'9782000000042'),(15,'9782000000043'),(15,'9782000000052'),(15,'9782000000069'),(15,'9782000000077'),(15,'9782000000079'),(15,'9782000000082'),(15,'9782000000084'),(15,'9782000000090'),(15,'9782000000091'),(15,'9782000000094'),(15,'9782000000098'),(16,'9782000000005'),(16,'9782000000006'),(16,'9782000000007'),(16,'9782000000012'),(16,'9782000000018'),(16,'9782000000022'),(16,'9782000000035'),(16,'9782000000040'),(16,'9782000000041'),(16,'9782000000047'),(16,'9782000000048'),(16,'9782000000050'),(16,'9782000000059'),(16,'9782000000060'),(16,'9782000000072'),(16,'9782000000075'),(16,'9782000000093'),(16,'9782000000099'),(17,'9782000000009'),(17,'9782000000010'),(17,'9782000000042'),(17,'9782000000044'),(17,'9782000000045'),(17,'9782000000053'),(17,'9782000000054'),(17,'9782000000060'),(17,'9782000000065'),(17,'9782000000068'),(17,'9782000000070'),(17,'9782000000084'),(17,'9782000000093'),(18,'9782000000032'),(18,'9782000000052'),(18,'9782000000058'),(18,'9782000000062'),(18,'9782000000064'),(18,'9782000000075'),(18,'9782000000082'),(18,'9782000000086'),(19,'9782000000026'),(19,'9782000000042'),(19,'9782000000043'),(19,'9782000000049'),(19,'9782000000061'),(20,'9782000000047'),(20,'9782000000048'),(20,'9782000000049'),(20,'9782000000059'),(20,'9782000000066'),(21,'9782000000050'),(21,'9782000000078'),(22,'9782000000067'),(22,'9782000000074'),(23,'9782000000002'),(23,'9782000000006'),(23,'9782000000036'),(23,'9782000000089'),(23,'9782000000090'),(23,'9782000000091'),(24,'9782000000036'),(24,'9782000000050'),(24,'9782000000065'),(25,'9782000000056'),(25,'9782000000057');
/*!40000 ALTER TABLE `book_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `books`
--

DROP TABLE IF EXISTS `books`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `books` (
  `ISBN` char(13) NOT NULL,
  `name` varchar(50) NOT NULL,
  `language` varchar(50) NOT NULL,
  `publisher` varchar(50) NOT NULL,
  `introduction` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`ISBN`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `books`
--

LOCK TABLES `books` WRITE;
/*!40000 ALTER TABLE `books` DISABLE KEYS */;
INSERT INTO `books` VALUES ('9782000000001','Red Chamber Dream','Chinese','Penguin Classics','A panoramic portrayal of love, decline, and Qing dynasty aristocracy.'),('9782000000002','Journey to the West','Chinese','Foreign Languages Press','A mythic pilgrimage blending adventure, satire, and spiritual allegory.'),('9782000000003','Water Margin','Chinese','Foreign Languages Press','Outlaw heroes challenge authority in a turbulent historical landscape.'),('9782000000004','Romance of the Three Kingdoms','Chinese','Foreign Languages Press','Political intrigue and warfare shape the fate of rival kingdoms.'),('9782000000005','The Scholars','Chinese','People\'s Literature Press','A satirical exposure of scholarly hypocrisy and social ambition.'),('9782000000006','Strange Tales from a Chinese Studio','Chinese','People\'s Literature Press','Supernatural tales reflecting morality, desire, and human folly.'),('9782000000007','Fortress Besieged','Chinese','Penguin Classics','An ironic study of marriage, intellect, and modern Chinese society.'),('9782000000008','Call to Arms','Chinese','People\'s Literature Press','Short stories confronting trauma, awakening, and national identity.'),('9782000000009','Border Town','Chinese','Penguin Classics','A lyrical coming-of-age story set in a remote riverside town.'),('9782000000010','Rickshaw Boy','Chinese','Penguin Classics','A tragic portrait of individual struggle within urban poverty.'),('9782000000011','Family','Chinese','People\'s Literature Press','Family conflict mirrors social change and generational tension.'),('9782000000012','Teahouse','Chinese','People\'s Literature Press','A stage panorama of social classes in modern China.'),('9782000000013','War and Peace','Russian','Vintage Classics','An epic depiction of war, history, and private lives.'),('9782000000014','Anna Karenina','Russian','Penguin Classics','Love and society collide under rigid moral conventions.'),('9782000000015','Crime and Punishment','Russian','Penguin Classics','A psychological descent driven by guilt, ideology, and conscience.'),('9782000000016','The Brothers Karamazov','Russian','Everyman\'s Library','Faith, doubt, and morality tested within one fractured family.'),('9782000000017','The Idiot','Russian','Penguin Classics','Innocence confronts cynicism in a morally compromised world.'),('9782000000018','Dead Souls','Russian','Oxford World\'s Classics','A grotesque satire of bureaucracy and social emptiness.'),('9782000000019','Fathers and Sons','Russian','Oxford World\'s Classics','Generational conflict between tradition and radical ideas.'),('9782000000020','Eugene Onegin','Russian','Penguin Classics','A poetic reflection on love, loss, and social alienation.'),('9782000000021','Doctor Zhivago','Russian','Vintage Classics','Private lives reshaped by revolution and historical upheaval.'),('9782000000022','The Master and Margarita','Russian','Penguin Classics','A fantastical satire of power, belief, and totalitarianism.'),('9782000000023','One Day in the Life of Ivan Denisovich','Russian','Vintage Classics','A stark account of survival within a labor camp.'),('9782000000024','The Cherry Orchard','Russian','Oxford World\'s Classics','An elegy for a fading aristocratic world.'),('9782000000025','Les Misérables','French','Penguin Classics','Justice, redemption, and suffering in post-revolutionary France.'),('9782000000026','The Hunchback of Notre-Dame','French','Oxford World\'s Classics','Love, fate, and architecture intertwine in medieval Paris.'),('9782000000027','The Count of Monte Cristo','French','Penguin Classics','A masterful tale of betrayal, endurance, and revenge.'),('9782000000028','The Three Musketeers','French','Penguin Classics','Friendship and honor amid political intrigue and adventure.'),('9782000000029','Madame Bovary','French','Oxford World\'s Classics','Domestic dissatisfaction exposes social and moral constraints.'),('9782000000030','The Red and the Black','French','Penguin Classics','Ambition and class anxiety drive a tragic social ascent.'),('9782000000031','Germinal','French','Penguin Classics','Industrial struggle and working-class life under capitalism.'),('9782000000032','In Search of Lost Time','French','Vintage Classics','Memory and consciousness reshape time and personal identity.'),('9782000000033','The Stranger','French','Vintage Classics','An exploration of alienation and moral absurdity.'),('9782000000034','The Plague','French','Vintage Classics','Human solidarity tested during an epidemic.'),('9782000000035','Candide','French','Penguin Classics','Optimism dismantled through sharp philosophical satire.'),('9782000000036','The Little Prince','French','Reynal & Hitchcock','A poetic fable about innocence, loss, and responsibility.'),('9782000000037','Hamlet','English','Arden Shakespeare','A prince confronts revenge, doubt, and moral responsibility.'),('9782000000038','Macbeth','English','Arden Shakespeare','Ambition and prophecy unravel moral order.'),('9782000000039','King Lear','English','Arden Shakespeare','Authority, madness, and family betrayal collide.'),('9782000000040','Pride and Prejudice','English','Penguin Classics','Love and class prejudice examined through irony.'),('9782000000041','Sense and Sensibility','English','Oxford World\'s Classics','Sisterhood and reason shape romantic choice.'),('9782000000042','Jane Eyre','English','Penguin Classics','A woman seeks autonomy through love and resilience.'),('9782000000043','Wuthering Heights','English','Penguin Classics','Passion and revenge erupt across a bleak landscape.'),('9782000000044','Great Expectations','English','Penguin Classics','Personal growth shaped by hardship and moral testing.'),('9782000000045','Oliver Twist','English','Penguin Classics','Childhood innocence confronted by social cruelty.'),('9782000000046','A Tale of Two Cities','English','Penguin Classics','Revolutionary violence alters private destinies.'),('9782000000047','Nineteen Eighty-Four','English','Penguin Classics','Totalitarian surveillance destroys truth and individuality.'),('9782000000048','Brave New World','English','Harper Perennial','A controlled society trades freedom for stability.'),('9782000000049','Frankenstein','English','Penguin Classics','Creation, responsibility, and unintended consequence.'),('9782000000050','Alice\'s Adventures in Wonderland','English','Macmillan','Logic and language dissolve in a playful fantasy.'),('9782000000051','Moby-Dick','English','Penguin Classics','An obsessive quest challenges humanity and faith.'),('9782000000052','The Great Gatsby','English','Scribner','Wealth and illusion mask moral emptiness.'),('9782000000053','To Kill a Mockingbird','English','J.B. Lippincott','Racial injustice examined through a child’s perspective.'),('9782000000054','The Catcher in the Rye','English','Little, Brown','Adolescent alienation and resistance to conformity.'),('9782000000055','The Grapes of Wrath','English','Penguin Classics','Economic hardship devastates a displaced family.'),('9782000000056','Of Mice and Men','English','Penguin Classics','Friendship and dreams collapse under harsh reality.'),('9782000000057','The Old Man and the Sea','English','Scribner','Perseverance and dignity in the face of defeat.'),('9782000000058','The Sun Also Rises','English','Scribner','Disillusionment of a postwar generation abroad.'),('9782000000059','Fahrenheit 451','English','Simon & Schuster','Books, censorship, and resistance in a future society.'),('9782000000060','Adventures of Huckleberry Finn','English','Penguin Classics','Freedom and morality along the Mississippi River.'),('9782000000061','The Scarlet Letter','English','Penguin Classics','Sin, shame, and judgment in a rigid society.'),('9782000000062','Invisible Man','English','Vintage Classics','Identity and invisibility in a racially divided nation.'),('9782000000063','Beloved','English','Vintage Classics','Historical trauma and memory haunt personal life.'),('9782000000064','The Sound and the Fury','English','Vintage Classics','Fragmented consciousness within a declining family.'),('9782000000065','Anne of Green Gables','English','McClelland & Stewart','Imagination and growth in a rural childhood.'),('9782000000066','The Handmaid\'s Tale','English','Anchor Books','Women’s autonomy challenged by authoritarian control.'),('9782000000067','Alias Grace','English','Anchor Books','Crime, memory, and female identity in Victorian Canada.'),('9782000000068','Life of Pi','English','Vintage Canada','Survival, faith, and storytelling at sea.'),('9782000000069','The English Patient','English','Vintage Canada','Love and loss against the backdrop of war.'),('9782000000070','Fifth Business','English','Penguin Canada','Identity shaped by myth, failure, and responsibility.'),('9782000000071','The Divine Comedy','Italian','Penguin Classics','A spiritual journey through hell, purgatory, and paradise.'),('9782000000072','The Decameron','Italian','Penguin Classics','Storytelling as refuge during social catastrophe.'),('9782000000073','The Prince','Italian','Oxford World\'s Classics','Pragmatic analysis of power and political rule.'),('9782000000074','The Name of the Rose','Italian','Harcourt','Murder, theology, and knowledge in a medieval abbey.'),('9782000000075','If on a winter\'s night a traveler','Italian','Vintage Classics','Reading, authorship, and narrative uncertainty.'),('9782000000076','The Leopard','Italian','Vintage Classics','Aristocratic decline amid national unification.'),('9782000000077','The Betrothed','Italian','Penguin Classics','Faith, justice, and suffering in historical Italy.'),('9782000000078','Orlando Furioso','Italian','Penguin Classics','Chivalric romance infused with imagination and irony.'),('9782000000079','The Tale of Genji','Japanese','Penguin Classics','Courtly love and politics in classical Japan.'),('9782000000080','The Pillow Book','Japanese','Penguin Classics','Observations of elegance and daily court life.'),('9782000000081','Kokoro','Japanese','Penguin Classics','Moral anxiety in a rapidly modernizing society.'),('9782000000082','Snow Country','Japanese','Vintage Classics','Loneliness and fleeting intimacy in a snowy landscape.'),('9782000000083','The Temple of the Golden Pavilion','Japanese','Vintage Classics','Obsession with beauty and destruction.'),('9782000000084','The Sound of Waves','Japanese','Penguin Classics','Young love shaped by tradition and nature.'),('9782000000085','No Longer Human','Japanese','New Directions','Alienation and self-destruction in modern life.'),('9782000000086','The Woman in the Dunes','Japanese','Vintage Classics','Existential struggle in an oppressive environment.'),('9782000000087','Silence','Japanese','Penguin Classics','Faith and doubt under religious persecution.'),('9782000000088','The Makioka Sisters','Japanese','Vintage Classics','Family decline during cultural transition.'),('9782000000089','The Tale of Hong Gildong','Korean','Penguin Classics','A rebellious hero challenges social hierarchy.'),('9782000000090','The Cloud Dream of the Nine','Korean','Penguin Classics','Dream, desire, and transcendence in classical narrative.'),('9782000000091','The Tale of Chunhyang','Korean','Penguin Classics','Love and loyalty defy rigid social order.'),('9782000000092','The Square','Korean','Penguin Classics','Ideological conflict and divided identity.'),('9782000000093','Our Twisted Hero','Korean','Penguin Classics','Power dynamics exposed through childhood allegory.'),('9782000000094','Please Look After Mom','Korean','Knopf','Family bonds tested by absence and memory.'),('9782000000095','The Vegetarian','Korean','Portobello Books','Violence and conformity examined through the body.'),('9782000000096','Human Acts','Korean','Portobello Books','Collective trauma during political repression.'),('9782000000097','The Guest','Korean','Penguin Classics','Historical violence and unresolved guilt.'),('9782000000098','Mother ','Korean','Penguin Classics','Everyday resilience of women across generations.'),('9782000000099','Kim Jiyoung, Born 1982','Korean','Cho Changbi','Gender roles questioned in contemporary society.'),('9782000000100','Azaleas','Korean','Penguin Classics','Lyric poems expressing longing and national sentiment.');
/*!40000 ALTER TABLE `books` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `catagories`
--

DROP TABLE IF EXISTS `catagories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `catagories` (
  `category_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `desecription` varchar(255) NOT NULL,
  PRIMARY KEY (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `catagories`
--

LOCK TABLES `catagories` WRITE;
/*!40000 ALTER TABLE `catagories` DISABLE KEYS */;
INSERT INTO `catagories` VALUES (1,'Novel','Long-form prose that explores characters, society, and human choices through sustained narrative.'),(2,'Historical Novel','Fiction that reconstructs the past by blending historical context with imagined personal experience.'),(3,'Psychological Novel','Narratives that focus on inner life, motivation, and mental conflict rather than external action.'),(4,'Philosophical Novel','Stories that dramatize philosophical questions about meaning, freedom, morality, and belief.'),(5,'Epic Poetry','Verse narratives that recount heroic, mythic, or civilizational stories on a grand scale.'),(6,'Poetry','Literary works that use rhythm, imagery, and condensed language to evoke emotion and thought.'),(7,'Drama','Literature written for performance, where conflict unfolds through dialogue and staged action.'),(8,'Short Story Collection','Collections of brief, self-contained narratives that capture decisive moments or insights.'),(9,'Essay/Diary','Reflective or observational prose that records ideas, experiences, or daily life directly.'),(10,'Political Treatise','Argumentative works that analyze power, governance, and the organization of society.'),(11,'Philosophy','Texts that investigate fundamental questions of knowledge, ethics, mind, and reality.'),(12,'Science','Works that explain natural phenomena through observation, evidence, and systematic reasoning.'),(13,'Psychology','Texts that explore human behavior and mental processes through theory and interpretation.'),(14,'Adventure','Stories driven by journeys, risk, and discovery, emphasizing action and exploration.'),(15,'Romance','Narratives centered on love and intimacy as tests of social norms and personal integrity.'),(16,'Satire','Works that criticize vice and hypocrisy through irony, exaggeration, and humor.'),(17,'Bildungsroman','Coming-of-age stories that trace personal growth through education, conflict, and experience.'),(18,'Modernist','Experimental literature that reflects fragmented modern experience through innovative form.'),(19,'Gothic','Fiction marked by dark atmosphere, hidden transgression, and psychological or moral fear.'),(20,'Science Fiction','Speculative narratives that use imagined futures or technologies to examine humanity and society.'),(21,'Fantasy','Stories set in invented worlds where magic or myth structures moral and narrative order.'),(22,'Mystery/Detective','Narratives organized around investigation and inference, leading to logical revelation.'),(23,'Myth/Folktale','Traditional stories that convey cultural values through myths, legends, and folk narratives.'),(24,'Children\'s Literature','Literature written for younger readers that develops imagination, empathy, and moral sense.'),(25,'Novella','A compact prose form focusing on a single conflict or transformation with high intensity.');
/*!40000 ALTER TABLE `catagories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `employee_id` int NOT NULL AUTO_INCREMENT,
  `store_id` int NOT NULL,
  `job_title_id` int NOT NULL,
  `user_id` int NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `phone` int unsigned NOT NULL,
  `performance` int unsigned DEFAULT NULL,
  PRIMARY KEY (`employee_id`),
  UNIQUE KEY `phone_UNIQUE` (`phone`),
  KEY `fk_employees_job_titles1_idx` (`job_title_id`),
  KEY `fk_employees_stores1_idx` (`store_id`),
  KEY `fk_employees_users1_idx` (`user_id`),
  CONSTRAINT `fk_employees_job_titles1` FOREIGN KEY (`job_title_id`) REFERENCES `job_titles` (`job_title_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_employees_stores1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_employees_users1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
INSERT INTO `employees` VALUES (1,1,4,78,'Alex','Tan',3200000001,95),(2,1,4,79,'Brian','Lim',3200000002,92),(3,1,4,80,'Chloe','Ng',3200000003,88),(4,1,3,81,'Dylan','Ong',3200000004,84),(5,2,3,82,'Ethan','Goh',3200000005,86),(6,3,3,83,'Fiona','Teo',3200000006,90),(7,4,3,84,'Grace','Lee',3200000007,83),(8,1,2,85,'Henry','Chua',3200000008,78),(9,2,2,86,'Ivy','Koh',3200000009,80),(10,3,2,87,'Jason','Ho',3200000010,76),(11,4,2,88,'Kelly','Yap',3200000011,82),(12,1,2,89,'Lucas','Low',3200000012,79),(13,1,2,90,'Megan','Wong',3200000013,74),(14,1,1,91,'Noah','Chan',3200000014,72),(15,2,1,92,'Olivia','Tan',3200000015,75),(16,3,1,93,'Peter','Ang',3200000016,70),(17,4,1,94,'Quinn','Seah',3200000017,73),(18,1,1,95,'Ryan','Sim',3200000018,71),(19,2,1,96,'Sophie','Lau',3200000019,68),(20,3,1,97,'Tristan','Foo',3200000020,66),(21,4,1,98,'Uma','Yeo',3200000021,69),(22,1,1,99,'Victor','Liew',3200000022,64),(23,2,1,100,'Wendy','Soh',3200000023,60);
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `favorites`
--

DROP TABLE IF EXISTS `favorites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `favorites` (
  `member_id` int NOT NULL,
  `ISBN` char(13) NOT NULL,
  `create_date` datetime NOT NULL,
  PRIMARY KEY (`member_id`,`ISBN`),
  KEY `fk_favorites_members1_idx` (`member_id`),
  KEY `fk_favorites_books1_idx` (`ISBN`),
  CONSTRAINT `fk_favorites_books1` FOREIGN KEY (`ISBN`) REFERENCES `books` (`ISBN`) ON UPDATE CASCADE,
  CONSTRAINT `fk_favorites_members1` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `favorites`
--

LOCK TABLES `favorites` WRITE;
/*!40000 ALTER TABLE `favorites` DISABLE KEYS */;
INSERT INTO `favorites` VALUES (1,'9782000000013','2025-12-01 10:00:00'),(1,'9782000000083','2025-12-06 15:00:00'),(2,'9782000000013','2025-12-01 10:05:00'),(2,'9782000000083','2025-12-06 15:05:00'),(3,'9782000000013','2025-12-01 10:10:00'),(3,'9782000000095','2025-12-06 15:10:00'),(4,'9782000000013','2025-12-01 10:15:00'),(4,'9782000000095','2025-12-06 15:15:00'),(5,'9782000000003','2025-12-07 16:00:00'),(5,'9782000000013','2025-12-01 10:20:00'),(6,'9782000000005','2025-12-07 16:05:00'),(6,'9782000000013','2025-12-01 10:25:00'),(7,'9782000000006','2025-12-07 16:10:00'),(7,'9782000000013','2025-12-01 10:30:00'),(8,'9782000000007','2025-12-07 16:15:00'),(8,'9782000000013','2025-12-01 10:35:00'),(9,'9782000000008','2025-12-07 16:20:00'),(9,'9782000000013','2025-12-01 10:40:00'),(10,'9782000000009','2025-12-07 16:25:00'),(10,'9782000000013','2025-12-01 10:45:00'),(11,'9782000000010','2025-12-07 16:30:00'),(11,'9782000000013','2025-12-01 10:50:00'),(12,'9782000000011','2025-12-07 16:35:00'),(12,'9782000000013','2025-12-01 10:55:00'),(13,'9782000000012','2025-12-07 16:40:00'),(13,'9782000000025','2025-12-02 11:00:00'),(14,'9782000000014','2025-12-07 16:45:00'),(14,'9782000000025','2025-12-02 11:05:00'),(15,'9782000000016','2025-12-07 16:50:00'),(15,'9782000000025','2025-12-02 11:10:00'),(16,'9782000000017','2025-12-07 16:55:00'),(16,'9782000000025','2025-12-02 11:15:00'),(17,'9782000000018','2025-12-07 17:00:00'),(17,'9782000000025','2025-12-02 11:20:00'),(18,'9782000000019','2025-12-07 17:05:00'),(18,'9782000000025','2025-12-02 11:25:00'),(19,'9782000000020','2025-12-07 17:10:00'),(19,'9782000000025','2025-12-02 11:30:00'),(20,'9782000000021','2025-12-07 17:15:00'),(20,'9782000000025','2025-12-02 11:35:00'),(21,'9782000000022','2025-12-07 17:20:00'),(21,'9782000000025','2025-12-02 11:40:00'),(22,'9782000000023','2025-12-07 17:25:00'),(22,'9782000000025','2025-12-02 11:45:00'),(23,'9782000000025','2025-12-02 11:50:00'),(24,'9782000000025','2025-12-02 11:55:00'),(25,'9782000000047','2025-12-03 12:00:00'),(26,'9782000000047','2025-12-03 12:05:00'),(27,'9782000000047','2025-12-03 12:10:00'),(28,'9782000000047','2025-12-03 12:15:00'),(29,'9782000000047','2025-12-03 12:20:00'),(30,'9782000000047','2025-12-03 12:25:00'),(31,'9782000000047','2025-12-03 12:30:00'),(32,'9782000000047','2025-12-03 12:35:00'),(33,'9782000000047','2025-12-03 12:40:00'),(34,'9782000000047','2025-12-03 12:45:00'),(35,'9782000000047','2025-12-03 12:50:00'),(36,'9782000000001','2025-12-04 09:00:00'),(37,'9782000000001','2025-12-04 09:05:00'),(38,'9782000000001','2025-12-04 09:10:00'),(39,'9782000000001','2025-12-04 09:15:00'),(40,'9782000000001','2025-12-04 09:20:00'),(41,'9782000000015','2025-12-04 09:25:00'),(42,'9782000000015','2025-12-04 09:30:00'),(43,'9782000000015','2025-12-04 09:35:00'),(44,'9782000000015','2025-12-04 09:40:00'),(45,'9782000000015','2025-12-04 09:45:00'),(46,'9782000000029','2025-12-04 09:50:00'),(47,'9782000000029','2025-12-04 09:55:00'),(48,'9782000000029','2025-12-04 10:00:00'),(49,'9782000000029','2025-12-04 10:05:00'),(50,'9782000000029','2025-12-04 10:10:00'),(51,'9782000000052','2025-12-04 10:15:00'),(52,'9782000000052','2025-12-04 10:20:00'),(53,'9782000000052','2025-12-04 10:25:00'),(54,'9782000000052','2025-12-04 10:30:00'),(55,'9782000000052','2025-12-04 10:35:00'),(56,'9782000000066','2025-12-04 10:40:00'),(57,'9782000000066','2025-12-04 10:45:00'),(58,'9782000000066','2025-12-04 10:50:00'),(59,'9782000000066','2025-12-04 10:55:00'),(60,'9782000000066','2025-12-04 11:00:00'),(61,'9782000000074','2025-12-04 11:05:00'),(62,'9782000000074','2025-12-04 11:10:00'),(63,'9782000000074','2025-12-04 11:15:00'),(64,'9782000000074','2025-12-04 11:20:00'),(65,'9782000000074','2025-12-04 11:25:00'),(66,'9782000000002','2025-12-05 14:00:00'),(67,'9782000000002','2025-12-05 14:05:00'),(68,'9782000000004','2025-12-05 14:10:00'),(69,'9782000000004','2025-12-05 14:15:00'),(70,'9782000000033','2025-12-05 14:20:00'),(71,'9782000000033','2025-12-05 14:25:00'),(72,'9782000000037','2025-12-05 14:30:00'),(73,'9782000000037','2025-12-05 14:35:00'),(74,'9782000000057','2025-12-05 14:40:00'),(75,'9782000000057','2025-12-05 14:45:00'),(76,'9782000000068','2025-12-05 14:50:00'),(77,'9782000000068','2025-12-05 14:55:00');
/*!40000 ALTER TABLE `favorites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_batches`
--

DROP TABLE IF EXISTS `inventory_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_batches` (
  `batch_id` int NOT NULL AUTO_INCREMENT,
  `sku_id` int NOT NULL,
  `store_id` int NOT NULL,
  `purchase_id` int NOT NULL,
  `quantity` int unsigned NOT NULL,
  `unit_cost` decimal(9,2) unsigned NOT NULL,
  `received_date` datetime NOT NULL,
  `batch_code` varchar(50) NOT NULL,
  PRIMARY KEY (`batch_id`),
  KEY `fk_inventories_SKUs1_idx` (`sku_id`),
  KEY `fk_inventories_stores1_idx` (`store_id`),
  KEY `fk_inventory_batches_purchases1_idx` (`purchase_id`),
  CONSTRAINT `fk_inventories_SKUs1` FOREIGN KEY (`sku_id`) REFERENCES `skus` (`sku_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_inventories_stores1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_inventory_batches_purchases1` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`purchase_id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=256 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_batches`
--

LOCK TABLES `inventory_batches` WRITE;
/*!40000 ALTER TABLE `inventory_batches` DISABLE KEYS */;
INSERT INTO `inventory_batches` VALUES (1,23,1,1,2,12.08,'2025-11-03 10:00:00','P1-SKU23'),(2,27,1,1,2,17.24,'2025-11-03 10:00:00','P1-SKU27'),(3,33,1,1,3,22.01,'2025-11-03 10:00:00','P1-SKU33'),(4,37,1,1,1,16.10,'2025-11-03 10:00:00','P1-SKU37'),(5,72,1,1,3,29.17,'2025-11-03 10:00:00','P1-SKU72'),(6,76,1,1,3,12.42,'2025-11-03 10:00:00','P1-SKU76'),(7,89,1,1,2,14.64,'2025-11-03 10:00:00','P1-SKU89'),(8,91,1,1,3,20.62,'2025-11-03 10:00:00','P1-SKU91'),(9,95,1,1,1,22.61,'2025-11-03 10:00:00','P1-SKU95'),(10,99,1,1,3,9.78,'2025-11-03 10:00:00','P1-SKU99'),(11,122,1,1,2,31.75,'2025-11-03 10:00:00','P1-SKU122'),(12,126,1,1,2,25.21,'2025-11-03 10:00:00','P1-SKU126'),(13,132,1,1,3,26.31,'2025-11-03 10:00:00','P1-SKU132'),(14,136,1,1,3,19.51,'2025-11-03 10:00:00','P1-SKU136'),(15,33,1,2,3,22.01,'2025-11-08 10:00:00','P2-SKU33'),(16,37,1,2,1,14.61,'2025-11-08 10:00:00','P2-SKU37'),(17,62,1,2,3,21.15,'2025-11-08 10:00:00','P2-SKU62'),(18,66,1,2,2,21.31,'2025-11-08 10:00:00','P2-SKU66'),(19,81,1,2,2,22.52,'2025-11-08 10:00:00','P2-SKU81'),(20,85,1,2,3,25.14,'2025-11-08 10:00:00','P2-SKU85'),(21,89,1,2,1,12.73,'2025-11-08 10:00:00','P2-SKU89'),(22,103,1,2,1,29.09,'2025-11-08 10:00:00','P2-SKU103'),(23,10,1,3,1,23.67,'2025-11-17 10:00:00','P3-SKU10'),(24,14,1,3,1,17.46,'2025-11-17 10:00:00','P3-SKU14'),(25,41,1,3,3,29.86,'2025-11-17 10:00:00','P3-SKU41'),(26,49,1,3,2,28.11,'2025-11-17 10:00:00','P3-SKU49'),(27,51,1,3,3,19.74,'2025-11-17 10:00:00','P3-SKU51'),(28,55,1,3,2,15.10,'2025-11-17 10:00:00','P3-SKU55'),(29,59,1,3,1,17.50,'2025-11-17 10:00:00','P3-SKU59'),(30,123,1,3,2,30.68,'2025-11-17 10:00:00','P3-SKU123'),(31,127,1,3,3,22.46,'2025-11-17 10:00:00','P3-SKU127'),(32,137,1,3,3,36.78,'2025-11-17 10:00:00','P3-SKU137'),(33,17,1,4,3,25.77,'2025-11-23 10:00:00','P4-SKU17'),(34,52,1,4,3,18.65,'2025-11-23 10:00:00','P4-SKU52'),(35,56,1,4,1,18.16,'2025-11-23 10:00:00','P4-SKU56'),(36,108,1,4,3,26.78,'2025-11-23 10:00:00','P4-SKU108'),(37,110,1,4,1,39.57,'2025-11-23 10:00:00','P4-SKU110'),(38,114,1,4,2,19.76,'2025-11-23 10:00:00','P4-SKU114'),(39,118,1,4,2,32.12,'2025-11-23 10:00:00','P4-SKU118'),(40,141,1,4,2,37.51,'2025-11-23 10:00:00','P4-SKU141'),(41,145,1,4,2,31.63,'2025-11-23 10:00:00','P4-SKU145'),(42,149,1,4,3,33.94,'2025-11-23 10:00:00','P4-SKU149'),(43,151,1,4,1,40.96,'2025-11-23 10:00:00','P4-SKU151'),(44,30,1,5,1,27.12,'2025-12-02 10:00:00','P5-SKU30'),(45,34,1,5,1,24.26,'2025-12-02 10:00:00','P5-SKU34'),(46,69,1,5,2,11.73,'2025-12-02 10:00:00','P5-SKU69'),(47,82,1,5,2,19.62,'2025-12-02 10:00:00','P5-SKU82'),(48,138,1,5,1,32.16,'2025-12-02 10:00:00','P5-SKU138'),(49,20,2,6,3,25.59,'2025-11-04 11:00:00','P6-SKU20'),(50,24,2,6,3,23.80,'2025-11-04 11:00:00','P6-SKU24'),(51,28,2,6,1,21.40,'2025-11-04 11:00:00','P6-SKU28'),(52,71,2,6,2,10.03,'2025-11-04 11:00:00','P6-SKU71'),(53,75,2,6,1,26.79,'2025-11-04 11:00:00','P6-SKU75'),(54,79,2,6,1,26.80,'2025-11-04 11:00:00','P6-SKU79'),(55,92,2,6,1,30.16,'2025-11-04 11:00:00','P6-SKU92'),(56,96,2,6,2,17.24,'2025-11-04 11:00:00','P6-SKU96'),(57,101,2,6,3,23.79,'2025-11-04 11:00:00','P6-SKU101'),(58,111,2,6,2,30.46,'2025-11-04 11:00:00','P6-SKU111'),(59,115,2,6,2,31.79,'2025-11-04 11:00:00','P6-SKU115'),(60,119,2,6,2,33.26,'2025-11-04 11:00:00','P6-SKU119'),(61,140,2,6,2,31.10,'2025-11-04 11:00:00','P6-SKU140'),(62,144,2,6,3,34.03,'2025-11-04 11:00:00','P6-SKU144'),(63,148,2,6,2,26.02,'2025-11-04 11:00:00','P6-SKU148'),(64,13,2,7,3,17.08,'2025-11-13 11:00:00','P7-SKU13'),(65,17,2,7,2,27.85,'2025-11-13 11:00:00','P7-SKU17'),(66,42,2,7,2,13.21,'2025-11-13 11:00:00','P7-SKU42'),(67,46,2,7,2,23.44,'2025-11-13 11:00:00','P7-SKU46'),(68,52,2,7,2,21.12,'2025-11-13 11:00:00','P7-SKU52'),(69,56,2,7,3,20.87,'2025-11-13 11:00:00','P7-SKU56'),(70,72,2,7,2,30.41,'2025-11-13 11:00:00','P7-SKU72'),(71,76,2,7,3,12.22,'2025-11-13 11:00:00','P7-SKU76'),(72,91,2,7,2,16.75,'2025-11-13 11:00:00','P7-SKU91'),(73,95,2,7,3,25.15,'2025-11-13 11:00:00','P7-SKU95'),(74,109,2,7,1,25.50,'2025-11-13 11:00:00','P7-SKU109'),(75,121,2,7,3,34.65,'2025-11-13 11:00:00','P7-SKU121'),(76,125,2,7,3,27.36,'2025-11-13 11:00:00','P7-SKU125'),(77,129,2,7,3,28.85,'2025-11-13 11:00:00','P7-SKU129'),(78,131,2,7,2,18.68,'2025-11-13 11:00:00','P7-SKU131'),(79,135,2,7,1,28.01,'2025-11-13 11:00:00','P7-SKU135'),(80,139,2,7,2,34.28,'2025-11-13 11:00:00','P7-SKU139'),(81,22,2,8,3,31.42,'2025-11-19 11:00:00','P8-SKU22'),(82,26,2,8,1,20.10,'2025-11-19 11:00:00','P8-SKU26'),(83,32,2,8,1,19.50,'2025-11-19 11:00:00','P8-SKU32'),(84,36,2,8,1,17.42,'2025-11-19 11:00:00','P8-SKU36'),(85,63,2,8,1,31.16,'2025-11-19 11:00:00','P8-SKU63'),(86,67,2,8,3,17.19,'2025-11-19 11:00:00','P8-SKU67'),(87,73,2,8,3,32.66,'2025-11-19 11:00:00','P8-SKU73'),(88,77,2,8,1,30.03,'2025-11-19 11:00:00','P8-SKU77'),(89,80,2,8,2,13.07,'2025-11-19 11:00:00','P8-SKU80'),(90,84,2,8,3,24.40,'2025-11-19 11:00:00','P8-SKU84'),(91,88,2,8,2,24.98,'2025-11-19 11:00:00','P8-SKU88'),(92,90,2,8,1,22.17,'2025-11-19 11:00:00','P8-SKU90'),(93,94,2,8,2,14.72,'2025-11-19 11:00:00','P8-SKU94'),(94,98,2,8,1,30.81,'2025-11-19 11:00:00','P8-SKU98'),(95,122,2,8,2,35.66,'2025-11-19 11:00:00','P8-SKU122'),(96,126,2,8,1,33.06,'2025-11-19 11:00:00','P8-SKU126'),(97,132,2,8,2,25.50,'2025-11-19 11:00:00','P8-SKU132'),(98,136,2,8,2,16.43,'2025-11-19 11:00:00','P8-SKU136'),(99,11,2,9,3,25.45,'2025-11-24 11:00:00','P9-SKU11'),(100,15,2,9,3,29.09,'2025-11-24 11:00:00','P9-SKU15'),(101,19,2,9,1,28.56,'2025-11-24 11:00:00','P9-SKU19'),(102,21,2,9,2,23.44,'2025-11-24 11:00:00','P9-SKU21'),(103,40,2,9,2,19.78,'2025-11-24 11:00:00','P9-SKU40'),(104,44,2,9,2,21.98,'2025-11-24 11:00:00','P9-SKU44'),(105,48,2,9,2,21.31,'2025-11-24 11:00:00','P9-SKU48'),(106,50,2,9,3,19.98,'2025-11-24 11:00:00','P9-SKU50'),(107,54,2,9,2,12.31,'2025-11-24 11:00:00','P9-SKU54'),(108,58,2,9,3,30.47,'2025-11-24 11:00:00','P9-SKU58'),(109,102,2,9,1,35.60,'2025-11-24 11:00:00','P9-SKU102'),(110,106,2,9,2,37.33,'2025-11-24 11:00:00','P9-SKU106'),(111,112,2,9,1,36.92,'2025-11-24 11:00:00','P9-SKU112'),(112,116,2,9,1,22.40,'2025-11-24 11:00:00','P9-SKU116'),(113,143,2,9,3,33.48,'2025-11-24 11:00:00','P9-SKU143'),(114,147,2,9,2,39.21,'2025-11-24 11:00:00','P9-SKU147'),(115,11,3,10,2,26.65,'2025-11-06 12:00:00','P10-SKU11'),(116,15,3,10,3,26.14,'2025-11-06 12:00:00','P10-SKU15'),(117,19,3,10,2,33.11,'2025-11-06 12:00:00','P10-SKU19'),(118,25,3,10,1,26.68,'2025-11-06 12:00:00','P10-SKU25'),(119,40,3,10,2,22.25,'2025-11-06 12:00:00','P10-SKU40'),(120,44,3,10,1,20.99,'2025-11-06 12:00:00','P10-SKU44'),(121,48,3,10,2,16.25,'2025-11-06 12:00:00','P10-SKU48'),(122,50,3,10,3,21.94,'2025-11-06 12:00:00','P10-SKU50'),(123,54,3,10,3,9.47,'2025-11-06 12:00:00','P10-SKU54'),(124,58,3,10,2,27.04,'2025-11-06 12:00:00','P10-SKU58'),(125,78,3,10,1,23.04,'2025-11-06 12:00:00','P10-SKU78'),(126,105,3,10,1,30.23,'2025-11-06 12:00:00','P10-SKU105'),(127,121,3,10,3,34.21,'2025-11-06 12:00:00','P10-SKU121'),(128,125,3,10,1,26.08,'2025-11-06 12:00:00','P10-SKU125'),(129,129,3,10,3,32.22,'2025-11-06 12:00:00','P10-SKU129'),(130,131,3,10,3,24.59,'2025-11-06 12:00:00','P10-SKU131'),(131,135,3,10,3,29.98,'2025-11-06 12:00:00','P10-SKU135'),(132,139,3,10,1,28.20,'2025-11-06 12:00:00','P10-SKU139'),(133,22,3,11,1,26.52,'2025-11-15 12:00:00','P11-SKU22'),(134,26,3,11,3,22.43,'2025-11-15 12:00:00','P11-SKU26'),(135,67,3,11,2,14.40,'2025-11-15 12:00:00','P11-SKU67'),(136,73,3,11,3,28.05,'2025-11-15 12:00:00','P11-SKU73'),(137,77,3,11,1,27.89,'2025-11-15 12:00:00','P11-SKU77'),(138,80,3,11,1,15.85,'2025-11-15 12:00:00','P11-SKU80'),(139,90,3,11,2,27.45,'2025-11-15 12:00:00','P11-SKU90'),(140,94,3,11,1,16.73,'2025-11-15 12:00:00','P11-SKU94'),(141,98,3,11,1,28.70,'2025-11-15 12:00:00','P11-SKU98'),(142,111,3,11,1,29.21,'2025-11-15 12:00:00','P11-SKU111'),(143,115,3,11,1,28.21,'2025-11-15 12:00:00','P11-SKU115'),(144,119,3,11,3,27.21,'2025-11-15 12:00:00','P11-SKU119'),(145,140,3,11,3,29.72,'2025-11-15 12:00:00','P11-SKU140'),(146,144,3,11,1,29.36,'2025-11-15 12:00:00','P11-SKU144'),(147,148,3,11,1,32.32,'2025-11-15 12:00:00','P11-SKU148'),(148,150,3,11,1,19.26,'2025-11-15 12:00:00','P11-SKU150'),(149,63,3,12,1,25.75,'2025-11-20 12:00:00','P12-SKU63'),(150,67,3,12,2,17.19,'2025-11-20 12:00:00','P12-SKU67'),(151,80,3,12,2,16.71,'2025-11-20 12:00:00','P12-SKU80'),(152,84,3,12,1,27.94,'2025-11-20 12:00:00','P12-SKU84'),(153,130,3,12,2,24.77,'2025-11-20 12:00:00','P12-SKU130'),(154,134,3,12,2,20.27,'2025-11-20 12:00:00','P12-SKU134'),(155,19,4,13,1,32.70,'2025-11-10 14:00:00','P13-SKU19'),(156,44,4,13,3,25.98,'2025-11-10 14:00:00','P13-SKU44'),(157,50,4,13,2,19.65,'2025-11-10 14:00:00','P13-SKU50'),(158,54,4,13,2,11.84,'2025-11-10 14:00:00','P13-SKU54'),(159,58,4,13,1,29.33,'2025-11-10 14:00:00','P13-SKU58'),(160,104,4,13,2,19.43,'2025-11-10 14:00:00','P13-SKU104'),(161,110,4,13,2,39.06,'2025-11-10 14:00:00','P13-SKU110'),(162,114,4,13,1,25.59,'2025-11-10 14:00:00','P13-SKU114'),(163,118,4,13,2,31.72,'2025-11-10 14:00:00','P13-SKU118'),(164,141,4,13,3,29.61,'2025-11-10 14:00:00','P13-SKU141'),(165,145,4,13,2,28.47,'2025-11-10 14:00:00','P13-SKU145'),(166,149,4,13,2,41.25,'2025-11-10 14:00:00','P13-SKU149'),(167,12,4,14,1,31.37,'2025-11-21 14:00:00','P14-SKU12'),(168,43,4,14,1,20.74,'2025-11-21 14:00:00','P14-SKU43'),(169,47,4,14,3,28.83,'2025-11-21 14:00:00','P14-SKU47'),(170,53,4,14,3,13.01,'2025-11-21 14:00:00','P14-SKU53'),(171,57,4,14,3,11.61,'2025-11-21 14:00:00','P14-SKU57'),(172,123,4,14,2,33.80,'2025-11-21 14:00:00','P14-SKU123'),(173,127,4,14,3,23.58,'2025-11-21 14:00:00','P14-SKU127'),(174,133,4,14,3,30.94,'2025-11-21 14:00:00','P14-SKU133'),(175,137,4,14,1,36.78,'2025-11-21 14:00:00','P14-SKU137'),(176,39,4,15,3,14.20,'2025-11-11 16:00:00','P15-SKU39'),(177,60,4,15,2,15.12,'2025-11-11 16:00:00','P15-SKU60'),(178,64,4,15,2,13.95,'2025-11-11 16:00:00','P15-SKU64'),(179,83,4,15,2,10.94,'2025-11-11 16:00:00','P15-SKU83'),(180,87,4,15,2,25.63,'2025-11-11 16:00:00','P15-SKU87'),(181,103,4,15,1,29.09,'2025-11-11 16:00:00','P15-SKU103'),(182,107,4,15,2,41.18,'2025-11-11 16:00:00','P15-SKU107');
/*!40000 ALTER TABLE `inventory_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `invoice_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `invoice_status` enum('draft','issued','partly_paid','paid','voided','credited') NOT NULL DEFAULT 'draft',
  `invoice_number` int unsigned NOT NULL,
  `issue_date` datetime NOT NULL,
  `due_date` datetime NOT NULL,
  `update_date` datetime NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`invoice_id`),
  KEY `fk_invoices_orders1_idx` (`order_id`),
  CONSTRAINT `fk_invoices_orders1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
INSERT INTO `invoices` VALUES (1,1,'paid',20250001,'2025-11-01 10:17:00','2025-11-08 10:12:00','2025-11-01 10:18:00','auto-generated from order'),(2,2,'paid',20250002,'2025-11-01 11:30:00','2025-11-08 11:25:00','2025-11-01 11:31:00','auto-generated from order'),(3,3,'paid',20250003,'2025-11-02 09:35:00','2025-11-09 09:30:00','2025-11-02 09:36:00','auto-generated from order'),(4,4,'paid',20250004,'2025-11-02 15:45:00','2025-11-09 15:40:00','2025-11-02 15:46:00','auto-generated from order'),(5,5,'paid',20250005,'2025-11-03 11:25:00','2025-11-10 11:20:00','2025-11-03 11:26:00','auto-generated from order'),(6,6,'paid',20250006,'2025-11-03 13:20:00','2025-11-10 13:15:00','2025-11-03 13:21:00','auto-generated from order'),(7,7,'paid',20250007,'2025-11-04 19:10:00','2025-11-11 19:05:00','2025-11-04 19:11:00','auto-generated from order'),(8,8,'paid',20250008,'2025-11-05 11:00:00','2025-11-12 10:55:00','2025-11-05 11:01:00','auto-generated from order'),(9,9,'paid',20250009,'2025-11-05 12:15:00','2025-11-12 12:10:00','2025-11-05 12:16:00','auto-generated from order'),(10,10,'paid',20250010,'2025-11-06 15:27:00','2025-11-13 15:22:00','2025-11-06 15:28:00','auto-generated from order'),(11,11,'paid',20250011,'2025-11-07 09:23:00','2025-11-14 09:18:00','2025-11-07 09:24:00','auto-generated from order'),(12,12,'paid',20250012,'2025-11-07 20:06:00','2025-11-14 20:01:00','2025-11-07 20:07:00','auto-generated from order'),(13,13,'paid',20250013,'2025-11-08 11:16:00','2025-11-15 11:11:00','2025-11-08 11:17:00','auto-generated from order'),(14,14,'paid',20250014,'2025-11-09 17:50:00','2025-11-16 17:45:00','2025-11-09 17:51:00','auto-generated from order'),(15,15,'paid',20250015,'2025-11-10 08:40:00','2025-11-17 08:35:00','2025-11-10 08:41:00','auto-generated from order'),(16,16,'paid',20250016,'2025-11-10 14:55:00','2025-11-17 14:50:00','2025-11-10 14:56:00','auto-generated from order'),(17,17,'draft',20250017,'2025-11-11 10:10:00','2025-11-18 10:05:00','2025-11-11 10:11:00','auto-generated from order'),(18,18,'draft',20250018,'2025-11-11 21:17:00','2025-11-18 21:12:00','2025-11-11 21:18:00','auto-generated from order'),(19,19,'draft',20250019,'2025-11-12 09:45:00','2025-11-19 09:40:00','2025-11-12 09:46:00','auto-generated from order'),(20,20,'draft',20250020,'2025-11-12 18:35:00','2025-11-19 18:30:00','2025-11-12 18:36:00','auto-generated from order'),(21,21,'voided',20250021,'2025-11-13 12:05:00','2025-11-20 12:00:00','2025-11-13 12:06:00','auto-generated from order'),(22,22,'voided',20250022,'2025-11-13 16:35:00','2025-11-20 16:30:00','2025-11-13 16:36:00','auto-generated from order'),(23,23,'paid',20250023,'2025-11-14 09:15:00','2025-11-21 09:10:00','2025-11-14 09:16:00','auto-generated from order'),(24,24,'paid',20250024,'2025-11-14 11:10:00','2025-11-21 11:05:00','2025-11-14 11:11:00','auto-generated from order'),(25,25,'paid',20250025,'2025-11-14 15:27:00','2025-11-21 15:22:00','2025-11-14 15:28:00','auto-generated from order'),(26,26,'paid',20250026,'2025-11-15 10:35:00','2025-11-22 10:30:00','2025-11-15 10:36:00','auto-generated from order'),(27,27,'paid',20250027,'2025-11-15 12:45:00','2025-11-22 12:40:00','2025-11-15 12:46:00','auto-generated from order'),(28,28,'paid',20250028,'2025-11-15 16:23:00','2025-11-22 16:18:00','2025-11-15 16:24:00','auto-generated from order'),(29,29,'paid',20250029,'2025-11-16 09:17:00','2025-11-23 09:12:00','2025-11-16 09:18:00','auto-generated from order'),(30,30,'paid',20250030,'2025-11-16 14:00:00','2025-11-23 13:55:00','2025-11-16 14:01:00','auto-generated from order'),(31,31,'paid',20250031,'2025-11-16 19:15:00','2025-11-23 19:10:00','2025-11-16 19:16:00','auto-generated from order'),(32,32,'paid',20250032,'2025-11-17 10:07:00','2025-11-24 10:02:00','2025-11-17 10:08:00','auto-generated from order'),(33,33,'paid',20250033,'2025-11-17 14:42:00','2025-11-24 14:37:00','2025-11-17 14:43:00','auto-generated from order'),(34,34,'paid',20250034,'2025-11-17 20:25:00','2025-11-24 20:20:00','2025-11-17 20:26:00','auto-generated from order'),(35,35,'draft',20250035,'2025-11-18 09:05:00','2025-11-25 09:00:00','2025-11-18 09:06:00','auto-generated from order'),(36,36,'draft',20250036,'2025-11-18 11:35:00','2025-11-25 11:30:00','2025-11-18 11:36:00','auto-generated from order'),(37,37,'draft',20250037,'2025-11-18 15:15:00','2025-11-25 15:10:00','2025-11-18 15:16:00','auto-generated from order'),(38,38,'draft',20250038,'2025-11-18 18:50:00','2025-11-25 18:45:00','2025-11-18 18:51:00','auto-generated from order'),(39,39,'voided',20250039,'2025-11-19 10:30:00','2025-11-26 10:25:00','2025-11-19 10:31:00','auto-generated from order'),(40,40,'voided',20250040,'2025-11-19 16:45:00','2025-11-26 16:40:00','2025-11-19 16:46:00','auto-generated from order');
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_titles`
--

DROP TABLE IF EXISTS `job_titles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_titles` (
  `job_title_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL DEFAULT 'staff',
  `base_salary` decimal(9,2) unsigned NOT NULL DEFAULT '1500.00',
  PRIMARY KEY (`job_title_id`),
  UNIQUE KEY `name_UNIQUE` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_titles`
--

LOCK TABLES `job_titles` WRITE;
/*!40000 ALTER TABLE `job_titles` DISABLE KEYS */;
INSERT INTO `job_titles` VALUES (1,'Staff',1500.00),(2,'Finance',1800.00),(3,'Store Manager',1900.00),(4,'Head Office',2000.00);
/*!40000 ALTER TABLE `job_titles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `member_tiers`
--

DROP TABLE IF EXISTS `member_tiers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `member_tiers` (
  `member_tier_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL DEFAULT 'standard',
  `discount_rate` decimal(9,2) unsigned NOT NULL DEFAULT '1.00',
  `earn_point_rate` decimal(9,2) unsigned NOT NULL DEFAULT '10.00',
  `min_lifetime_spend` decimal(9,2) unsigned NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`member_tier_id`),
  UNIQUE KEY `name_UNIQUE` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `member_tiers`
--

LOCK TABLES `member_tiers` WRITE;
/*!40000 ALTER TABLE `member_tiers` DISABLE KEYS */;
INSERT INTO `member_tiers` VALUES (1,'standard',1.00,10.00,0.00),(2,'bronze',0.95,12.00,500.00),(3,'sliver',0.90,15.00,1000.00),(4,'gold',0.85,20.00,2000.00);
/*!40000 ALTER TABLE `member_tiers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `members`
--

DROP TABLE IF EXISTS `members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `members` (
  `member_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `member_tier_id` int NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `phone` int unsigned NOT NULL,
  `point` int unsigned NOT NULL,
  `address` varchar(50) DEFAULT NULL,
  `birthday` date DEFAULT NULL,
  PRIMARY KEY (`member_id`),
  UNIQUE KEY `phone_UNIQUE` (`phone`),
  KEY `fk_members_users1_idx` (`user_id`),
  KEY `fk_members_member_tiers1_idx` (`member_tier_id`),
  CONSTRAINT `fk_members_member_tiers1` FOREIGN KEY (`member_tier_id`) REFERENCES `member_tiers` (`member_tier_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_members_users1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=78 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `members`
--

LOCK TABLES `members` WRITE;
/*!40000 ALTER TABLE `members` DISABLE KEYS */;
INSERT INTO `members` VALUES (1,1,1,'Ethan','Smith',3100000001,120,'Blk 10, Street 1','1996-05-12'),(2,2,1,'Olivia','Johnson',3100000002,80,'',NULL),(3,3,1,'Noah','Brown',3100000003,150,NULL,'1993-11-03'),(4,4,1,'Ava','Taylor',3100000004,60,'Blk 13, Street 4',NULL),(5,5,1,'Liam','Anderson',3100000005,200,NULL,'1990-02-20'),(6,6,1,'Mia','Thomas',3100000006,45,NULL,NULL),(7,7,1,'Lucas','Jackson',3100000007,95,'Blk 16, Street 7',NULL),(8,8,1,'Sophia','White',3100000008,30,'Blk 17, Street 8',NULL),(9,9,1,'Mason','Harris',3100000009,110,NULL,'1995-09-08'),(10,10,1,'Isabella','Martin',3100000010,75,NULL,NULL),(11,11,1,'Logan','Thompson',3100000011,160,'Blk 20, Street 11','1992-12-25'),(12,12,1,'Amelia','Garcia',3100000012,55,NULL,NULL),(13,13,1,'James','Martinez',3100000013,140,'Blk 22, Street 13','1997-03-14'),(14,14,1,'Harper','Robinson',3100000014,20,'Blk 23, Street 14',NULL),(15,15,1,'Benjamin','Clark',3100000015,85,NULL,'1991-08-30'),(16,16,1,'Evelyn','Rodriguez',3100000016,90,'Blk 25, Street 16',NULL),(17,17,1,'Henry','Lewis',3100000017,130,'Blk 26, Street 17','1994-10-10'),(18,18,1,'Abigail','Lee',3100000018,40,NULL,NULL),(19,19,1,'Alexander','Walker',3100000019,105,'Blk 28, Street 19','1999-01-01'),(20,20,1,'Emily','Hall',3100000020,70,NULL,NULL),(21,21,1,'Daniel','Allen',3100000021,115,NULL,NULL),(22,22,1,'Ella','Young',3100000022,65,'Blk 31, Street 22',NULL),(23,23,1,'Michael','Hernandez',3100000023,125,'Blk 32, Street 23','1996-04-22'),(24,24,1,'Avery','King',3100000024,35,NULL,NULL),(25,25,1,'Jackson','Wright',3100000025,155,NULL,'1993-09-17'),(26,26,1,'Scarlett','Lopez',3100000026,50,'Blk 35, Street 26',NULL),(27,27,1,'Sebastian','Hill',3100000027,100,NULL,'1992-02-02'),(28,28,1,'Grace','Scott',3100000028,25,'Blk 37, Street 28',NULL),(29,29,1,'Jack','Green',3100000029,135,'Blk 38, Street 29','1998-12-12'),(30,30,1,'Chloe','Adams',3100000030,85,NULL,NULL),(31,31,1,'Owen','Baker',3100000031,95,'Blk 40, Street 31','1995-07-07'),(32,32,1,'Lily','Gonzalez',3100000032,60,'Blk 41, Street 32',NULL),(33,33,1,'Matthew','Nelson',3100000033,150,NULL,'1991-03-03'),(34,34,1,'Hannah','Carter',3100000034,45,'Blk 43, Street 34',NULL),(35,35,1,'Samuel','Mitchell',3100000035,110,NULL,NULL),(36,36,1,'Zoey','Perez',3100000036,70,NULL,NULL),(37,37,1,'Joseph','Roberts',3100000037,90,'Blk 46, Street 37','1994-04-04'),(38,38,1,'Nora','Turner',3100000038,55,'Blk 47, Street 38',NULL),(39,39,1,'David','Phillips',3100000039,140,NULL,'1996-06-16'),(40,40,1,'Riley','Campbell',3100000040,65,NULL,NULL),(41,41,2,'Wyatt','Parker',3100000041,260,'Blk 50, Street 41','1992-05-05'),(42,42,2,'Victoria','Evans',3100000042,220,NULL,NULL),(43,43,2,'John','Edwards',3100000043,300,'Blk 52, Street 43','1990-10-20'),(44,44,2,'Aria','Collins',3100000044,240,'Blk 53, Street 44',NULL),(45,45,2,'Luke','Stewart',3100000045,280,NULL,'1997-02-14'),(46,46,2,'Penelope','Sanchez',3100000046,210,'Blk 55, Street 46',NULL),(47,47,2,'Gabriel','Morris',3100000047,330,'Blk 56, Street 47','1993-03-13'),(48,48,2,'Layla','Rogers',3100000048,205,NULL,NULL),(49,49,2,'Anthony','Reed',3100000049,290,'Blk 58, Street 49',NULL),(50,50,2,'Lillian','Cook',3100000050,235,NULL,NULL),(51,51,2,'Isaac','Morgan',3100000051,310,NULL,'1991-01-21'),(52,52,2,'Addison','Bell',3100000052,225,'Blk 61, Street 52',NULL),(53,53,2,'Dylan','Murphy',3100000053,275,'Blk 62, Street 53','1998-08-08'),(54,54,2,'Aubrey','Bailey',3100000054,215,NULL,NULL),(55,55,2,'Nathan','Rivera',3100000055,305,NULL,'1994-12-01'),(56,56,2,'Savannah','Cooper',3100000056,245,'Blk 65, Street 56',NULL),(57,57,2,'Andrew','Richardson',3100000057,295,NULL,'1996-09-19'),(58,58,2,'Brooklyn','Cox',3100000058,230,'Blk 67, Street 58',NULL),(59,59,2,'Joshua','Howard',3100000059,320,'Blk 68, Street 59','1992-06-30'),(60,60,2,'Bella','Ward',3100000060,240,NULL,NULL),(61,61,3,'Christopher','Peterson',3100000061,520,'Blk 70, Street 61','1989-07-07'),(62,62,3,'Claire','Gray',3100000062,480,'Blk 71, Street 62',NULL),(63,63,3,'Thomas','Ramirez',3100000063,600,NULL,NULL),(64,64,3,'Stella','James',3100000064,450,'Blk 73, Street 64',NULL),(65,65,3,'Caleb','Watson',3100000065,570,NULL,'1993-12-12'),(66,66,3,'Lucy','Brooks',3100000066,490,NULL,NULL),(67,67,3,'Ryan','Kelly',3100000067,620,'Blk 76, Street 67','1995-05-15'),(68,68,3,'Madison','Sanders',3100000068,460,'Blk 77, Street 68',NULL),(69,69,3,'Adam','Price',3100000069,585,NULL,'1991-09-09'),(70,70,3,'Leah','Bennett',3100000070,510,NULL,NULL),(71,71,3,'Leo','Wood',3100000071,640,'Blk 80, Street 71','1992-02-22'),(72,72,3,'Anna','Barnes',3100000072,500,NULL,NULL),(73,73,4,'Oscar','Ross',3100000073,980,'Blk 82, Street 73','1988-03-03'),(74,74,4,'Sienna','Henderson',3100000074,1100,'Blk 83, Street 74',NULL),(75,75,4,'Julian','Coleman',3100000075,1250,NULL,'1990-10-10'),(76,76,4,'Eva','Jenkins',3100000076,900,'Blk 85, Street 76',NULL),(77,77,4,'Miles','Perry',3100000077,1400,'Blk 86, Street 77',NULL);
/*!40000 ALTER TABLE `members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `sku_id` int NOT NULL,
  `order_id` int NOT NULL,
  `quantity` int unsigned NOT NULL,
  PRIMARY KEY (`sku_id`,`order_id`),
  KEY `fk_order_items_SKUs1_idx` (`sku_id`),
  KEY `fk_order_items_orders1_idx` (`order_id`),
  CONSTRAINT `fk_order_items_orders1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_order_items_SKUs1` FOREIGN KEY (`sku_id`) REFERENCES `skus` (`sku_id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1,1,1),(2,8,1),(3,1,1),(4,13,1),(5,2,1),(5,10,2),(6,5,1),(6,26,1),(7,5,1),(7,7,1),(7,17,1),(7,36,1),(8,2,1),(8,24,1),(9,3,2),(9,5,3),(9,20,2),(9,39,1),(10,15,1),(11,9,1),(11,25,2),(12,6,2),(12,29,1),(13,3,2),(13,18,2),(14,9,1),(14,21,1),(14,35,2),(15,1,2),(15,30,1),(16,12,2),(16,34,1),(17,4,1),(17,27,2),(18,16,2),(18,31,1),(19,8,2),(19,9,2),(19,24,1),(20,11,1),(20,40,2),(21,10,1),(21,19,1),(21,33,1),(22,2,1),(22,10,1),(23,14,1),(24,22,1),(25,8,1),(25,38,2),(26,17,1),(27,1,2),(27,28,1),(28,4,1),(29,32,2),(30,23,2),(31,10,1),(32,37,1),(33,5,2),(33,6,2),(34,14,2),(35,11,2),(35,29,2),(36,20,1),(37,39,1),(39,12,1),(40,12,1),(40,33,1),(41,6,1),(42,23,1),(44,4,1),(44,15,1),(45,2,2),(46,27,1),(47,5,1),(47,40,1),(48,18,1),(49,30,1),(51,7,1),(52,10,1),(53,36,2),(54,25,1),(55,13,1),(57,20,1),(58,32,1),(59,15,2),(60,8,1),(60,13,1),(61,13,2),(61,38,1),(63,28,1),(65,21,2),(66,35,1),(68,10,2),(69,25,1),(72,7,2),(72,13,2),(73,14,1),(73,30,1),(77,23,1),(79,40,1),(80,15,2),(81,15,1),(84,33,2),(88,2,1),(88,25,2),(90,18,1),(91,28,2),(92,35,1),(96,30,2),(99,16,1),(100,16,1),(101,38,1),(110,17,1),(111,18,2),(112,19,1),(113,19,1),(114,20,2),(120,4,1),(120,40,2),(130,21,1),(140,22,1),(150,22,1),(151,8,1);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `order_id` int NOT NULL AUTO_INCREMENT,
  `store_id` int NOT NULL,
  `member_id` int NOT NULL,
  `order_status` enum('created','paid','cancelled','refunded') NOT NULL DEFAULT 'created',
  `order_date` datetime NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`order_id`),
  KEY `fk_orders_stores1_idx` (`store_id`),
  KEY `fk_orders_members1_idx` (`member_id`),
  CONSTRAINT `fk_orders_members1` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_orders_stores1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,1,46,'paid','2025-11-01 10:12:00',NULL),(2,1,36,'paid','2025-11-01 11:25:00',NULL),(3,2,40,'paid','2025-11-02 09:30:00',NULL),(4,2,16,'paid','2025-11-02 15:40:00',NULL),(5,3,34,'paid','2025-11-03 11:20:00',NULL),(6,3,47,'paid','2025-11-03 13:15:00',NULL),(7,4,55,'paid','2025-11-04 19:05:00',NULL),(8,4,55,'paid','2025-11-05 10:55:00',NULL),(9,1,31,'paid','2025-11-05 12:10:00',NULL),(10,2,69,'paid','2025-11-06 15:22:00',NULL),(11,3,21,'paid','2025-11-07 09:18:00',NULL),(12,4,52,'paid','2025-11-07 20:01:00',NULL),(13,1,44,'paid','2025-11-08 11:11:00',NULL),(14,2,60,'paid','2025-11-09 17:45:00',NULL),(15,3,17,'paid','2025-11-10 08:35:00',NULL),(16,4,56,'paid','2025-11-10 14:50:00',NULL),(17,1,76,'created','2025-11-11 10:05:00','waiting payment'),(18,2,58,'created','2025-11-11 21:12:00','waiting payment'),(19,3,61,'created','2025-11-12 09:40:00','waiting payment'),(20,4,55,'created','2025-11-12 18:30:00','waiting payment'),(21,2,14,'cancelled','2025-11-13 12:00:00','user cancelled'),(22,3,56,'cancelled','2025-11-13 16:30:00','timeout cancelled'),(23,1,8,'paid','2025-11-14 09:10:00',NULL),(24,2,26,'paid','2025-11-14 11:05:00',NULL),(25,3,29,'paid','2025-11-14 15:22:00',NULL),(26,4,67,'paid','2025-11-15 10:30:00',NULL),(27,1,14,'paid','2025-11-15 12:40:00',NULL),(28,2,23,'paid','2025-11-15 16:18:00',NULL),(29,3,72,'paid','2025-11-16 09:12:00',NULL),(30,4,62,'paid','2025-11-16 13:55:00',NULL),(31,1,14,'paid','2025-11-16 19:10:00',NULL),(32,2,40,'paid','2025-11-17 10:02:00',NULL),(33,3,4,'paid','2025-11-17 14:37:00',NULL),(34,4,52,'paid','2025-11-17 20:20:00',NULL),(35,1,17,'created','2025-11-18 09:00:00','waiting payment'),(36,2,4,'created','2025-11-18 11:30:00','waiting payment'),(37,3,47,'created','2025-11-18 15:10:00','waiting payment'),(38,4,70,'created','2025-11-18 18:45:00','waiting payment'),(39,2,54,'cancelled','2025-11-19 10:25:00','user cancelled'),(40,3,58,'cancelled','2025-11-19 16:40:00','timeout cancelled');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_allocations`
--

DROP TABLE IF EXISTS `payment_allocations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_allocations` (
  `invoice_id` int NOT NULL,
  `payment_id` int NOT NULL,
  `create_date` datetime NOT NULL,
  `allocated_amount` decimal(9,2) unsigned NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`invoice_id`,`payment_id`),
  KEY `fk_payment_allocations_invoices1_idx` (`invoice_id`),
  KEY `fk_payment_allocations_payments1_idx` (`payment_id`),
  CONSTRAINT `fk_payment_allocations_invoices1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`invoice_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_payment_allocations_payments1` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`payment_id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_allocations`
--

LOCK TABLES `payment_allocations` WRITE;
/*!40000 ALTER TABLE `payment_allocations` DISABLE KEYS */;
INSERT INTO `payment_allocations` VALUES (1,1,'2025-11-01 10:29:00',0.00,'full allocation'),(2,1,'2025-11-01 11:42:00',0.00,'full allocation'),(3,2,'2025-11-02 09:47:00',0.00,'full allocation'),(4,2,'2025-11-02 15:57:00',0.00,'full allocation'),(5,3,'2025-11-03 11:37:00',0.00,'full allocation'),(6,3,'2025-11-03 13:32:00',0.00,'full allocation'),(7,4,'2025-11-04 19:22:00',0.00,'full allocation'),(8,4,'2025-11-05 11:12:00',0.00,'full allocation'),(9,5,'2025-11-05 12:27:00',0.00,'full allocation'),(10,5,'2025-11-06 15:39:00',0.00,'full allocation'),(11,6,'2025-11-07 09:35:00',0.00,'full allocation'),(12,6,'2025-11-07 20:18:00',0.00,'full allocation'),(13,7,'2025-11-08 11:28:00',0.00,'full allocation'),(14,7,'2025-11-09 18:02:00',0.00,'full allocation'),(15,8,'2025-11-10 08:52:00',0.00,'full allocation'),(16,8,'2025-11-10 15:07:00',0.00,'full allocation'),(23,9,'2025-11-14 09:27:00',0.00,'full allocation'),(24,9,'2025-11-14 11:22:00',0.00,'full allocation'),(25,10,'2025-11-14 15:39:00',0.00,'full allocation'),(26,10,'2025-11-15 10:47:00',0.00,'full allocation'),(27,11,'2025-11-15 12:57:00',0.00,'full allocation'),(28,11,'2025-11-15 16:35:00',0.00,'full allocation'),(29,12,'2025-11-16 09:29:00',0.00,'full allocation'),(30,12,'2025-11-16 14:12:00',0.00,'full allocation'),(31,13,'2025-11-16 19:27:00',0.00,'full allocation'),(32,13,'2025-11-17 10:19:00',0.00,'full allocation'),(33,14,'2025-11-17 14:54:00',0.00,'full allocation'),(34,14,'2025-11-17 20:37:00',0.00,'full allocation');
/*!40000 ALTER TABLE `payment_allocations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `payment_id` int NOT NULL AUTO_INCREMENT,
  `member_id` int NOT NULL,
  `create_date` datetime NOT NULL,
  `update_date` datetime NOT NULL,
  `amount` decimal(9,2) unsigned NOT NULL,
  `payment_method` enum('Credit Card','Third-Party Payment','Cash') NOT NULL DEFAULT 'Cash',
  `note` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`payment_id`),
  KEY `fk_payments_members1_idx` (`member_id`),
  CONSTRAINT `fk_payments_members1` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,36,'2025-11-01 10:27:00','2025-11-01 10:27:00',0.00,'Cash','batch pay 1'),(2,16,'2025-11-02 09:45:00','2025-11-02 09:45:00',0.00,'Cash','batch pay 2'),(3,34,'2025-11-03 11:35:00','2025-11-03 11:35:00',0.00,'Cash','batch pay 3'),(4,55,'2025-11-04 19:20:00','2025-11-04 19:20:00',0.00,'Cash','batch pay 4'),(5,31,'2025-11-05 12:25:00','2025-11-05 12:25:00',0.00,'Cash','batch pay 5'),(6,21,'2025-11-07 09:33:00','2025-11-07 09:33:00',0.00,'Cash','batch pay 6'),(7,44,'2025-11-08 11:26:00','2025-11-08 11:26:00',0.00,'Credit Card','batch pay 7'),(8,17,'2025-11-10 08:50:00','2025-11-10 08:50:00',0.00,'Credit Card','batch pay 8'),(9,8,'2025-11-14 09:25:00','2025-11-14 09:25:00',0.00,'Third-Party Payment','batch pay 9'),(10,29,'2025-11-14 15:37:00','2025-11-14 15:37:00',0.00,'Cash','batch pay 10'),(11,14,'2025-11-15 12:55:00','2025-11-15 12:55:00',0.00,'Cash','batch pay 11'),(12,62,'2025-11-16 09:27:00','2025-11-16 09:27:00',0.00,'Cash','batch pay 12'),(13,14,'2025-11-16 19:25:00','2025-11-16 19:25:00',0.00,'Cash','batch pay 13'),(14,4,'2025-11-17 14:52:00','2025-11-17 14:52:00',0.00,'Cash','batch pay 14');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `point_ledgers`
--

DROP TABLE IF EXISTS `point_ledgers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `point_ledgers` (
  `point_ledger_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `create_date` datetime NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`point_ledger_id`),
  KEY `fk_point_ledgers_orders1_idx` (`order_id`),
  CONSTRAINT `fk_point_ledgers_orders1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `point_ledgers`
--

LOCK TABLES `point_ledgers` WRITE;
/*!40000 ALTER TABLE `point_ledgers` DISABLE KEYS */;
INSERT INTO `point_ledgers` VALUES (1,1,'2025-11-01 10:21:00','points for paid order'),(2,2,'2025-11-01 11:34:00','points for paid order'),(3,3,'2025-11-02 09:39:00','points for paid order'),(4,4,'2025-11-02 15:49:00','points for paid order'),(5,5,'2025-11-03 11:29:00','points for paid order'),(6,6,'2025-11-03 13:24:00','points for paid order'),(7,7,'2025-11-04 19:14:00','points for paid order'),(8,8,'2025-11-05 11:04:00','points for paid order'),(9,9,'2025-11-05 12:19:00','points for paid order'),(10,10,'2025-11-06 15:31:00','points for paid order'),(11,11,'2025-11-07 09:27:00','points for paid order'),(12,12,'2025-11-07 20:10:00','points for paid order'),(13,13,'2025-11-08 11:20:00','points for paid order'),(14,14,'2025-11-09 17:54:00','points for paid order'),(15,15,'2025-11-10 08:44:00','points for paid order'),(16,16,'2025-11-10 14:59:00','points for paid order'),(17,23,'2025-11-14 09:19:00','points for paid order'),(18,24,'2025-11-14 11:14:00','points for paid order'),(19,25,'2025-11-14 15:31:00','points for paid order'),(20,26,'2025-11-15 10:39:00','points for paid order'),(21,27,'2025-11-15 12:49:00','points for paid order'),(22,28,'2025-11-15 16:27:00','points for paid order'),(23,29,'2025-11-16 09:21:00','points for paid order'),(24,30,'2025-11-16 14:04:00','points for paid order'),(25,31,'2025-11-16 19:19:00','points for paid order'),(26,32,'2025-11-17 10:11:00','points for paid order'),(27,33,'2025-11-17 14:46:00','points for paid order'),(28,34,'2025-11-17 20:29:00','points for paid order');
/*!40000 ALTER TABLE `point_ledgers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_items`
--

DROP TABLE IF EXISTS `purchase_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_items` (
  `purchase_id` int NOT NULL,
  `sku_id` int NOT NULL,
  `quantity` int unsigned NOT NULL,
  PRIMARY KEY (`purchase_id`,`sku_id`),
  KEY `fk_purchase_items_purchases1_idx` (`purchase_id`),
  KEY `fk_purchase_items_SKUs1_idx` (`sku_id`),
  CONSTRAINT `fk_purchase_items_purchases1` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`purchase_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_purchase_items_SKUs1` FOREIGN KEY (`sku_id`) REFERENCES `skus` (`sku_id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_items`
--

LOCK TABLES `purchase_items` WRITE;
/*!40000 ALTER TABLE `purchase_items` DISABLE KEYS */;
INSERT INTO `purchase_items` VALUES (1,23,2),(1,27,2),(1,33,3),(1,37,1),(1,72,3),(1,76,3),(1,89,2),(1,91,3),(1,95,1),(1,99,3),(1,122,2),(1,126,2),(1,132,3),(1,136,3),(2,33,3),(2,37,1),(2,62,3),(2,66,2),(2,81,2),(2,85,3),(2,89,1),(2,103,1),(3,10,1),(3,14,1),(3,41,3),(3,49,2),(3,51,3),(3,55,2),(3,59,1),(3,123,2),(3,127,3),(3,137,3),(4,17,3),(4,52,3),(4,56,1),(4,108,3),(4,110,1),(4,114,2),(4,118,2),(4,141,2),(4,145,2),(4,149,3),(4,151,1),(5,30,1),(5,34,1),(5,69,2),(5,82,2),(5,138,1),(6,20,3),(6,24,3),(6,28,1),(6,71,2),(6,75,1),(6,79,1),(6,92,1),(6,96,2),(6,101,3),(6,111,2),(6,115,2),(6,119,2),(6,140,2),(6,144,3),(6,148,2),(7,13,3),(7,17,2),(7,42,2),(7,46,2),(7,52,2),(7,56,3),(7,72,2),(7,76,3),(7,91,2),(7,95,3),(7,109,1),(7,121,3),(7,125,3),(7,129,3),(7,131,2),(7,135,1),(7,139,2),(8,22,3),(8,26,1),(8,32,1),(8,36,1),(8,63,1),(8,67,3),(8,73,3),(8,77,1),(8,80,2),(8,84,3),(8,88,2),(8,90,1),(8,94,2),(8,98,1),(8,122,2),(8,126,1),(8,132,2),(8,136,2),(9,11,3),(9,15,3),(9,19,1),(9,21,2),(9,40,2),(9,44,2),(9,48,2),(9,50,3),(9,54,2),(9,58,3),(9,102,1),(9,106,2),(9,112,1),(9,116,1),(9,143,3),(9,147,2),(10,11,2),(10,15,3),(10,19,2),(10,25,1),(10,40,2),(10,44,1),(10,48,2),(10,50,3),(10,54,3),(10,58,2),(10,78,1),(10,105,1),(10,121,3),(10,125,1),(10,129,3),(10,131,3),(10,135,3),(10,139,1),(11,22,1),(11,26,3),(11,67,2),(11,73,3),(11,77,1),(11,80,1),(11,90,2),(11,94,1),(11,98,1),(11,111,1),(11,115,1),(11,119,3),(11,140,3),(11,144,1),(11,148,1),(11,150,1),(12,63,1),(12,67,2),(12,80,2),(12,84,1),(12,130,2),(12,134,2),(13,19,1),(13,44,3),(13,50,2),(13,54,2),(13,58,1),(13,104,2),(13,110,2),(13,114,1),(13,118,2),(13,141,3),(13,145,2),(13,149,2),(14,12,1),(14,43,1),(14,47,3),(14,53,3),(14,57,3),(14,123,2),(14,127,3),(14,133,3),(14,137,1),(15,39,3),(15,60,2),(15,64,2),(15,83,2),(15,87,2),(15,103,1),(15,107,2),(16,21,1),(16,25,2),(16,29,3),(16,60,3),(16,70,1),(16,74,2),(16,78,2),(16,87,1),(16,93,2),(16,97,1),(16,122,3),(16,126,3),(17,12,3),(17,16,3),(17,43,1),(17,47,2),(17,102,2),(17,106,2),(17,112,2),(17,116,2),(18,23,3),(18,27,1),(18,33,2),(18,37,1),(18,72,3),(18,76,2),(18,81,1),(18,89,1),(18,91,2),(18,95,2),(18,99,3),(18,101,2),(18,105,3),(18,109,1),(18,111,2),(18,115,3),(18,119,3),(18,140,1),(18,144,2),(18,148,3),(19,10,3),(19,14,1),(19,18,1),(19,45,2),(19,49,3),(19,131,3),(19,135,1),(20,20,2),(20,24,1),(20,30,2),(20,34,3),(20,38,2),(20,61,1),(20,65,1),(20,69,2),(20,79,2),(20,82,2),(20,86,2),(20,122,3),(20,126,2),(20,132,2),(20,136,1),(21,42,1),(21,46,2),(21,52,3),(21,56,2),(21,102,1),(21,106,1),(21,116,1),(21,143,2),(21,147,3),(22,13,1),(22,17,3),(22,42,3),(22,46,3),(22,52,2),(22,56,1),(22,123,1),(22,127,3),(22,133,1),(22,137,3),(22,146,1),(23,20,3),(23,24,3),(23,75,1),(23,79,3),(23,92,2),(23,103,3),(24,23,1),(24,27,1),(24,62,1),(24,72,3),(24,76,1),(24,81,1),(24,85,3),(24,91,2),(24,95,2),(24,99,3),(24,120,2),(24,130,3),(24,134,3),(24,138,2),(25,18,2),(25,41,1),(25,110,2),(25,114,3),(25,149,1),(26,10,2),(26,18,1),(26,41,3),(26,45,1),(26,49,2),(26,51,1),(26,55,1),(26,59,2),(26,125,3),(26,129,2),(26,131,2),(26,135,1),(26,139,1),(27,33,1),(27,62,3),(27,66,1),(27,81,2),(27,85,1),(27,89,2),(27,111,2),(27,119,3),(27,140,1),(27,144,1),(28,1,3),(28,12,1),(28,16,2),(28,32,2),(28,36,2),(28,43,1),(28,47,3),(28,53,1),(28,57,1),(28,102,1),(28,106,3),(28,112,1),(28,116,1),(28,132,1),(28,143,3),(28,147,3),(29,31,2),(29,35,1),(29,64,2),(29,68,1),(29,83,3),(29,122,2),(29,126,1),(30,2,2),(30,6,1),(30,10,2),(30,14,1),(30,18,1),(30,41,3),(30,45,2),(30,49,3),(30,51,1),(30,55,1),(30,108,1),(30,110,3),(30,114,3),(30,118,3),(30,141,2),(30,145,3),(30,149,1),(30,151,3);
/*!40000 ALTER TABLE `purchase_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchases`
--

DROP TABLE IF EXISTS `purchases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchases` (
  `purchase_id` int NOT NULL AUTO_INCREMENT,
  `store_id` int NOT NULL,
  `supplier_id` int NOT NULL,
  `purchase_date` datetime NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`purchase_id`),
  KEY `fk_purchases_stores1_idx` (`store_id`),
  KEY `fk_purchases_suppliers1_idx` (`supplier_id`),
  CONSTRAINT `fk_purchases_stores1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_purchases_suppliers1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`supplier_id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchases`
--

LOCK TABLES `purchases` WRITE;
/*!40000 ALTER TABLE `purchases` DISABLE KEYS */;
INSERT INTO `purchases` VALUES (1,1,1,'2025-11-01 10:00:00','Monthly restock'),(2,1,2,'2025-11-08 10:00:00','Top sellers replenishment'),(3,1,3,'2025-11-15 10:00:00',NULL),(4,1,4,'2025-11-22 10:00:00','Holiday preparation'),(5,1,5,'2025-11-29 10:00:00',NULL),(6,2,6,'2025-11-03 11:00:00','Weekly restock'),(7,2,7,'2025-11-10 11:00:00',NULL),(8,2,8,'2025-11-17 11:00:00','New arrivals'),(9,2,9,'2025-11-24 11:00:00',NULL),(10,3,10,'2025-11-05 12:00:00','Inventory balancing'),(11,3,11,'2025-11-12 12:00:00',NULL),(12,3,12,'2025-11-19 12:00:00','Classic series restock'),(13,4,13,'2025-11-07 14:00:00',NULL),(14,4,14,'2025-11-21 14:00:00','Local demand'),(15,4,15,'2025-11-09 16:00:00','New store initial stock'),(16,1,6,'2025-12-01 10:00:00','Supplement restock'),(17,1,7,'2025-12-05 10:00:00',NULL),(18,1,8,'2025-12-10 10:00:00','Holiday refill'),(19,2,9,'2025-12-02 11:00:00',NULL),(20,2,10,'2025-12-07 11:00:00','Popular titles'),(21,2,11,'2025-12-12 11:00:00',NULL),(22,3,12,'2025-12-03 12:00:00','Classics restock'),(23,3,13,'2025-12-08 12:00:00',NULL),(24,3,14,'2025-12-13 12:00:00',NULL),(25,4,15,'2025-12-04 14:00:00',NULL),(26,4,16,'2025-12-09 14:00:00','Local demand'),(27,4,17,'2025-12-14 14:00:00',NULL),(28,5,18,'2025-12-05 16:00:00','New arrivals'),(29,5,1,'2025-12-10 16:00:00',NULL),(30,5,2,'2025-12-15 16:00:00','Year end stock');
/*!40000 ALTER TABLE `purchases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `skus`
--

DROP TABLE IF EXISTS `skus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `skus` (
  `sku_id` int NOT NULL AUTO_INCREMENT,
  `ISBN` char(13) NOT NULL,
  `unit_price` decimal(9,2) unsigned NOT NULL,
  `bingding` enum('Hardcover','Paperback','Mass Market Paperback') NOT NULL,
  PRIMARY KEY (`sku_id`),
  KEY `fk_SKUs_books1_idx` (`ISBN`),
  CONSTRAINT `fk_SKUs_books1` FOREIGN KEY (`ISBN`) REFERENCES `books` (`ISBN`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=256 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `skus`
--

LOCK TABLES `skus` WRITE;
/*!40000 ALTER TABLE `skus` DISABLE KEYS */;
INSERT INTO `skus` VALUES (1,'9782000000001',26.40,'Paperback'),(2,'9782000000002',23.06,'Paperback'),(3,'9782000000003',22.84,'Paperback'),(4,'9782000000004',23.51,'Paperback'),(5,'9782000000005',39.45,'Paperback'),(6,'9782000000006',28.27,'Paperback'),(7,'9782000000007',19.89,'Paperback'),(8,'9782000000008',29.48,'Paperback'),(9,'9782000000009',35.46,'Paperback'),(10,'9782000000010',31.99,'Paperback'),(11,'9782000000011',39.77,'Paperback'),(12,'9782000000012',44.19,'Paperback'),(13,'9782000000013',26.69,'Paperback'),(14,'9782000000014',26.86,'Paperback'),(15,'9782000000015',42.16,'Paperback'),(16,'9782000000016',30.02,'Paperback'),(17,'9782000000017',41.56,'Paperback'),(18,'9782000000018',31.81,'Paperback'),(19,'9782000000019',41.39,'Paperback'),(20,'9782000000020',38.20,'Paperback'),(21,'9782000000021',38.42,'Paperback'),(22,'9782000000022',40.80,'Paperback'),(23,'9782000000023',19.18,'Paperback'),(24,'9782000000024',31.73,'Paperback'),(25,'9782000000025',39.23,'Paperback'),(26,'9782000000026',29.13,'Paperback'),(27,'9782000000027',22.39,'Paperback'),(28,'9782000000028',35.66,'Paperback'),(29,'9782000000029',41.76,'Paperback'),(30,'9782000000030',34.77,'Paperback'),(31,'9782000000031',19.47,'Paperback'),(32,'9782000000032',27.85,'Paperback'),(33,'9782000000033',30.15,'Paperback'),(34,'9782000000034',40.44,'Paperback'),(35,'9782000000035',39.62,'Paperback'),(36,'9782000000036',26.80,'Paperback'),(37,'9782000000037',21.18,'Paperback'),(38,'9782000000038',33.19,'Paperback'),(39,'9782000000039',19.45,'Paperback'),(40,'9782000000040',30.90,'Paperback'),(41,'9782000000041',37.32,'Paperback'),(42,'9782000000042',16.94,'Paperback'),(43,'9782000000043',25.92,'Paperback'),(44,'9782000000044',33.31,'Paperback'),(45,'9782000000045',38.85,'Paperback'),(46,'9782000000046',34.47,'Paperback'),(47,'9782000000047',36.49,'Paperback'),(48,'9782000000048',26.64,'Paperback'),(49,'9782000000049',37.98,'Paperback'),(50,'9782000000050',32.75,'Paperback'),(51,'9782000000051',31.33,'Paperback'),(52,'9782000000052',27.43,'Paperback'),(53,'9782000000053',19.13,'Paperback'),(54,'9782000000054',15.78,'Paperback'),(55,'9782000000055',20.68,'Paperback'),(56,'9782000000056',27.10,'Paperback'),(57,'9782000000057',19.04,'Paperback'),(58,'9782000000058',38.09,'Paperback'),(59,'9782000000059',23.03,'Paperback'),(60,'9782000000060',22.24,'Paperback'),(61,'9782000000061',23.98,'Paperback'),(62,'9782000000062',34.68,'Paperback'),(63,'9782000000063',41.54,'Paperback'),(64,'9782000000064',21.13,'Paperback'),(65,'9782000000065',30.47,'Paperback'),(66,'9782000000066',31.81,'Paperback'),(67,'9782000000067',23.23,'Paperback'),(68,'9782000000068',26.74,'Paperback'),(69,'9782000000069',18.92,'Paperback'),(70,'9782000000070',29.45,'Paperback'),(71,'9782000000071',15.67,'Paperback'),(72,'9782000000072',41.09,'Paperback'),(73,'9782000000073',41.87,'Paperback'),(74,'9782000000074',38.96,'Paperback'),(75,'9782000000075',39.98,'Paperback'),(76,'9782000000076',20.36,'Paperback'),(77,'9782000000077',42.90,'Paperback'),(78,'9782000000078',33.39,'Paperback'),(79,'9782000000079',35.73,'Paperback'),(80,'9782000000080',21.42,'Paperback'),(81,'9782000000081',31.28,'Paperback'),(82,'9782000000082',30.66,'Paperback'),(83,'9782000000083',17.64,'Paperback'),(84,'9782000000084',39.35,'Paperback'),(85,'9782000000085',38.09,'Paperback'),(86,'9782000000086',39.23,'Paperback'),(87,'9782000000087',36.61,'Paperback'),(88,'9782000000088',32.44,'Paperback'),(89,'9782000000089',21.22,'Paperback'),(90,'9782000000090',35.19,'Paperback'),(91,'9782000000091',25.77,'Paperback'),(92,'9782000000092',43.71,'Paperback'),(93,'9782000000093',31.97,'Paperback'),(94,'9782000000094',22.30,'Paperback'),(95,'9782000000095',31.84,'Paperback'),(96,'9782000000096',22.98,'Paperback'),(97,'9782000000097',21.72,'Paperback'),(98,'9782000000098',42.21,'Paperback'),(99,'9782000000099',16.03,'Paperback'),(100,'9782000000100',41.85,'Paperback'),(101,'9782000000004',33.51,'Hardcover'),(102,'9782000000005',49.45,'Hardcover'),(103,'9782000000006',38.27,'Hardcover'),(104,'9782000000007',29.89,'Hardcover'),(105,'9782000000010',41.99,'Hardcover'),(106,'9782000000011',49.77,'Hardcover'),(107,'9782000000012',54.19,'Hardcover'),(108,'9782000000013',36.69,'Hardcover'),(109,'9782000000018',41.81,'Hardcover'),(110,'9782000000019',51.39,'Hardcover'),(111,'9782000000024',41.73,'Hardcover'),(112,'9782000000025',49.23,'Hardcover'),(113,'9782000000026',39.13,'Hardcover'),(114,'9782000000027',32.39,'Hardcover'),(115,'9782000000030',44.77,'Hardcover'),(116,'9782000000031',29.47,'Hardcover'),(117,'9782000000032',37.85,'Hardcover'),(118,'9782000000033',40.15,'Hardcover'),(119,'9782000000038',43.19,'Hardcover'),(120,'9782000000039',29.45,'Hardcover'),(121,'9782000000044',43.31,'Hardcover'),(122,'9782000000045',48.85,'Hardcover'),(123,'9782000000046',44.47,'Hardcover'),(124,'9782000000047',46.49,'Hardcover'),(125,'9782000000050',42.75,'Hardcover'),(126,'9782000000051',41.33,'Hardcover'),(127,'9782000000052',37.43,'Hardcover'),(128,'9782000000053',29.13,'Hardcover'),(129,'9782000000058',48.09,'Hardcover'),(130,'9782000000059',33.03,'Hardcover'),(131,'9782000000064',31.13,'Hardcover'),(132,'9782000000065',40.47,'Hardcover'),(133,'9782000000066',41.81,'Hardcover'),(134,'9782000000067',33.23,'Hardcover'),(135,'9782000000070',39.45,'Hardcover'),(136,'9782000000071',25.67,'Hardcover'),(137,'9782000000072',51.09,'Hardcover'),(138,'9782000000073',51.87,'Hardcover'),(139,'9782000000078',43.39,'Hardcover'),(140,'9782000000079',45.73,'Hardcover'),(141,'9782000000084',49.35,'Hardcover'),(142,'9782000000085',48.09,'Hardcover'),(143,'9782000000086',49.23,'Hardcover'),(144,'9782000000087',46.61,'Hardcover'),(145,'9782000000090',45.19,'Hardcover'),(146,'9782000000091',35.77,'Hardcover'),(147,'9782000000092',53.71,'Hardcover'),(148,'9782000000093',41.97,'Hardcover'),(149,'9782000000098',52.21,'Hardcover'),(150,'9782000000099',26.03,'Hardcover'),(151,'9782000000100',51.85,'Hardcover');
/*!40000 ALTER TABLE `skus` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stores`
--

DROP TABLE IF EXISTS `stores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stores` (
  `store_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `address` varchar(50) NOT NULL,
  `telephone` int NOT NULL,
  `status` enum('close','open','top sales') NOT NULL DEFAULT 'open',
  PRIMARY KEY (`store_id`),
  UNIQUE KEY `address_UNIQUE` (`address`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stores`
--

LOCK TABLES `stores` WRITE;
/*!40000 ALTER TABLE `stores` DISABLE KEYS */;
INSERT INTO `stores` VALUES (1,'Downtown Store','101 Main Street',2100000001,'top sales'),(2,'University Store','202 College Road',2100000002,'open'),(3,'Community Store','303 Oak Avenue',2100000003,'open'),(4,'Suburban Store','404 Lake Drive',2100000004,'open'),(5,'Airport Store','505 Airport Road',2100000005,'close');
/*!40000 ALTER TABLE `stores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `supplier_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `phone` int unsigned NOT NULL,
  `address` varchar(50) DEFAULT NULL,
  `email` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`supplier_id`),
  UNIQUE KEY `name_UNIQUE` (`name`),
  UNIQUE KEY `phone_UNIQUE` (`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES (1,'Global Books Ltd',3101000001,'12 King Street','contact@globalbooks.com'),(2,'Eastern Publishing',3101000002,'88 East Road','sales@easternpub.com'),(3,'Northern Press',3101000003,'45 North Avenue',NULL),(4,'Southern Media',3101000004,'66 South Street','info@southernmedia.com'),(5,'Westwind Books',3101000005,NULL,'service@westwind.com'),(6,'Classic House',3101000006,'9 Heritage Lane',NULL),(7,'Modern Reads',3101000007,'120 Innovation Blvd','hello@modernreads.com'),(8,'Academic Source',3101000008,'75 Scholar Road','support@academicsource.com'),(9,'Literary Bridge',3101000009,NULL,NULL),(10,'World Text Supply',3101000010,'33 Global Way','contact@worldtext.com'),(11,'Urban Knowledge',3101000011,'18 City Plaza',NULL),(12,'Heritage Classics',3101000012,'7 Old Town Street','info@heritageclassics.com'),(13,'Blue River Books',3101000013,NULL,'blueriver@books.com'),(14,'Silver Leaf Supply',3101000014,'54 Maple Road',NULL),(15,'Sunrise Publishing',3101000015,'101 Sunrise Ave','sales@sunrisepub.com'),(16,'Horizon Distributors',3101000016,'88 Horizon Street','contact@horizondist.com'),(17,'Knowledge Tree',3101000017,NULL,'info@knowledgetree.com'),(18,'Atlas Book Supply',3101000018,'200 Atlas Boulevard',NULL);
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(50) NOT NULL,
  `create_date` datetime NOT NULL,
  `last_log_date` datetime NOT NULL,
  `user_types` enum('member','employee') NOT NULL DEFAULT 'member',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username_UNIQUE` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=101 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'member001','hash_m001','2025-01-02 09:00:00','2025-12-10 20:10:00','member'),(2,'member002','hash_m002','2025-01-03 09:00:00','2025-12-11 20:10:00','member'),(3,'member003','hash_m003','2025-01-04 09:00:00','2025-12-12 20:10:00','member'),(4,'member004','hash_m004','2025-01-05 09:00:00','2025-12-13 20:10:00','member'),(5,'member005','hash_m005','2025-01-06 09:00:00','2025-12-14 20:10:00','member'),(6,'member006','hash_m006','2025-01-07 09:00:00','2025-12-15 20:10:00','member'),(7,'member007','hash_m007','2025-01-08 09:00:00','2025-12-16 20:10:00','member'),(8,'member008','hash_m008','2025-01-09 09:00:00','2025-12-17 20:10:00','member'),(9,'member009','hash_m009','2025-01-10 09:00:00','2025-12-18 20:10:00','member'),(10,'member010','hash_m010','2025-01-11 09:00:00','2025-12-09 20:10:00','member'),(11,'member011','hash_m011','2025-01-12 09:00:00','2025-12-10 20:10:00','member'),(12,'member012','hash_m012','2025-01-13 09:00:00','2025-12-11 20:10:00','member'),(13,'member013','hash_m013','2025-01-14 09:00:00','2025-12-12 20:10:00','member'),(14,'member014','hash_m014','2025-01-15 09:00:00','2025-12-13 20:10:00','member'),(15,'member015','hash_m015','2025-01-16 09:00:00','2025-12-14 20:10:00','member'),(16,'member016','hash_m016','2025-01-17 09:00:00','2025-12-15 20:10:00','member'),(17,'member017','hash_m017','2025-01-18 09:00:00','2025-12-16 20:10:00','member'),(18,'member018','hash_m018','2025-01-19 09:00:00','2025-12-17 20:10:00','member'),(19,'member019','hash_m019','2025-01-20 09:00:00','2025-12-18 20:10:00','member'),(20,'member020','hash_m020','2025-01-21 09:00:00','2025-12-09 20:10:00','member'),(21,'member021','hash_m021','2025-01-22 09:00:00','2025-12-10 20:10:00','member'),(22,'member022','hash_m022','2025-01-23 09:00:00','2025-12-11 20:10:00','member'),(23,'member023','hash_m023','2025-01-24 09:00:00','2025-12-12 20:10:00','member'),(24,'member024','hash_m024','2025-01-25 09:00:00','2025-12-13 20:10:00','member'),(25,'member025','hash_m025','2025-01-26 09:00:00','2025-12-14 20:10:00','member'),(26,'member026','hash_m026','2025-01-27 09:00:00','2025-12-15 20:10:00','member'),(27,'member027','hash_m027','2025-01-28 09:00:00','2025-12-16 20:10:00','member'),(28,'member028','hash_m028','2025-01-29 09:00:00','2025-12-17 20:10:00','member'),(29,'member029','hash_m029','2025-01-30 09:00:00','2025-12-18 20:10:00','member'),(30,'member030','hash_m030','2025-01-31 09:00:00','2025-12-09 20:10:00','member'),(31,'member031','hash_m031','2025-02-01 09:00:00','2025-12-10 20:10:00','member'),(32,'member032','hash_m032','2025-02-02 09:00:00','2025-12-11 20:10:00','member'),(33,'member033','hash_m033','2025-02-03 09:00:00','2025-12-12 20:10:00','member'),(34,'member034','hash_m034','2025-02-04 09:00:00','2025-12-13 20:10:00','member'),(35,'member035','hash_m035','2025-02-05 09:00:00','2025-12-14 20:10:00','member'),(36,'member036','hash_m036','2025-02-06 09:00:00','2025-12-15 20:10:00','member'),(37,'member037','hash_m037','2025-02-07 09:00:00','2025-12-16 20:10:00','member'),(38,'member038','hash_m038','2025-02-08 09:00:00','2025-12-17 20:10:00','member'),(39,'member039','hash_m039','2025-02-09 09:00:00','2025-12-18 20:10:00','member'),(40,'member040','hash_m040','2025-02-10 09:00:00','2025-12-09 20:10:00','member'),(41,'member041','hash_m041','2025-02-11 09:00:00','2025-12-10 20:10:00','member'),(42,'member042','hash_m042','2025-02-12 09:00:00','2025-12-11 20:10:00','member'),(43,'member043','hash_m043','2025-02-13 09:00:00','2025-12-12 20:10:00','member'),(44,'member044','hash_m044','2025-02-14 09:00:00','2025-12-13 20:10:00','member'),(45,'member045','hash_m045','2025-02-15 09:00:00','2025-12-14 20:10:00','member'),(46,'member046','hash_m046','2025-02-16 09:00:00','2025-12-15 20:10:00','member'),(47,'member047','hash_m047','2025-02-17 09:00:00','2025-12-16 20:10:00','member'),(48,'member048','hash_m048','2025-02-18 09:00:00','2025-12-17 20:10:00','member'),(49,'member049','hash_m049','2025-02-19 09:00:00','2025-12-18 20:10:00','member'),(50,'member050','hash_m050','2025-02-20 09:00:00','2025-12-09 20:10:00','member'),(51,'member051','hash_m051','2025-02-21 09:00:00','2025-12-10 20:10:00','member'),(52,'member052','hash_m052','2025-02-22 09:00:00','2025-12-11 20:10:00','member'),(53,'member053','hash_m053','2025-02-23 09:00:00','2025-12-12 20:10:00','member'),(54,'member054','hash_m054','2025-02-24 09:00:00','2025-12-13 20:10:00','member'),(55,'member055','hash_m055','2025-02-25 09:00:00','2025-12-14 20:10:00','member'),(56,'member056','hash_m056','2025-02-26 09:00:00','2025-12-15 20:10:00','member'),(57,'member057','hash_m057','2025-02-27 09:00:00','2025-12-16 20:10:00','member'),(58,'member058','hash_m058','2025-02-28 09:00:00','2025-12-17 20:10:00','member'),(59,'member059','hash_m059','2025-03-01 09:00:00','2025-12-18 20:10:00','member'),(60,'member060','hash_m060','2025-03-02 09:00:00','2025-12-09 20:10:00','member'),(61,'member061','hash_m061','2025-03-03 09:00:00','2025-12-10 20:10:00','member'),(62,'member062','hash_m062','2025-03-04 09:00:00','2025-12-11 20:10:00','member'),(63,'member063','hash_m063','2025-03-05 09:00:00','2025-12-12 20:10:00','member'),(64,'member064','hash_m064','2025-03-06 09:00:00','2025-12-13 20:10:00','member'),(65,'member065','hash_m065','2025-03-07 09:00:00','2025-12-14 20:10:00','member'),(66,'member066','hash_m066','2025-03-08 09:00:00','2025-12-15 20:10:00','member'),(67,'member067','hash_m067','2025-03-09 09:00:00','2025-12-16 20:10:00','member'),(68,'member068','hash_m068','2025-03-10 09:00:00','2025-12-17 20:10:00','member'),(69,'member069','hash_m069','2025-03-11 09:00:00','2025-12-18 20:10:00','member'),(70,'member070','hash_m070','2025-03-12 09:00:00','2025-12-09 20:10:00','member'),(71,'member071','hash_m071','2025-03-13 09:00:00','2025-12-10 20:10:00','member'),(72,'member072','hash_m072','2025-03-14 09:00:00','2025-12-11 20:10:00','member'),(73,'member073','hash_m073','2025-03-15 09:00:00','2025-12-12 20:10:00','member'),(74,'member074','hash_m074','2025-03-16 09:00:00','2025-12-13 20:10:00','member'),(75,'member075','hash_m075','2025-03-17 09:00:00','2025-12-14 20:10:00','member'),(76,'member076','hash_m076','2025-03-18 09:00:00','2025-12-15 20:10:00','member'),(77,'member077','hash_m077','2025-03-19 09:00:00','2025-12-16 20:10:00','member'),(78,'emp001','hash_e001','2024-11-01 08:30:00','2025-12-18 09:05:00','employee'),(79,'emp002','hash_e002','2024-11-08 08:30:00','2025-12-18 09:05:00','employee'),(80,'emp003','hash_e003','2024-11-15 08:30:00','2025-12-18 09:05:00','employee'),(81,'emp004','hash_e004','2024-11-22 08:30:00','2025-12-18 09:05:00','employee'),(82,'emp005','hash_e005','2024-11-29 08:30:00','2025-12-18 09:05:00','employee'),(83,'emp006','hash_e006','2024-12-06 08:30:00','2025-12-18 09:05:00','employee'),(84,'emp007','hash_e007','2024-12-13 08:30:00','2025-12-18 09:05:00','employee'),(85,'emp008','hash_e008','2024-12-20 08:30:00','2025-12-18 09:05:00','employee'),(86,'emp009','hash_e009','2025-01-03 08:30:00','2025-12-18 09:05:00','employee'),(87,'emp010','hash_e010','2025-01-10 08:30:00','2025-12-18 09:05:00','employee'),(88,'emp011','hash_e011','2025-01-17 08:30:00','2025-12-18 09:05:00','employee'),(89,'emp012','hash_e012','2025-01-24 08:30:00','2025-12-18 09:05:00','employee'),(90,'emp013','hash_e013','2025-01-31 08:30:00','2025-12-18 09:05:00','employee'),(91,'emp014','hash_e014','2025-02-07 08:30:00','2025-12-18 09:05:00','employee'),(92,'emp015','hash_e015','2025-02-14 08:30:00','2025-12-18 09:05:00','employee'),(93,'emp016','hash_e016','2025-02-21 08:30:00','2025-12-18 09:05:00','employee'),(94,'emp017','hash_e017','2025-02-28 08:30:00','2025-12-18 09:05:00','employee'),(95,'emp018','hash_e018','2025-03-07 08:30:00','2025-12-18 09:05:00','employee'),(96,'emp019','hash_e019','2025-03-14 08:30:00','2025-12-18 09:05:00','employee'),(97,'emp020','hash_e020','2025-03-21 08:30:00','2025-12-18 09:05:00','employee'),(98,'emp021','hash_e021','2025-03-28 08:30:00','2025-12-18 09:05:00','employee'),(99,'emp022','hash_e022','2025-04-04 08:30:00','2025-12-18 09:05:00','employee'),(100,'emp023','hash_e023','2025-04-11 08:30:00','2025-12-18 09:05:00','employee');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `vw_active_announcements`
--

DROP TABLE IF EXISTS `vw_active_announcements`;
/*!50001 DROP VIEW IF EXISTS `vw_active_announcements`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_active_announcements` AS SELECT 
 1 AS `announcement_id`,
 1 AS `title`,
 1 AS `content`,
 1 AS `publish_at`*/;
SET character_set_client = @saved_cs_client;

--
-- Final view structure for view `vw_active_announcements`
--

/*!50001 DROP VIEW IF EXISTS `vw_active_announcements`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb3 */;
/*!50001 SET character_set_results     = utf8mb3 */;
/*!50001 SET collation_connection      = utf8mb3_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_active_announcements` AS select `announcements`.`announcement_id` AS `announcement_id`,`announcements`.`title` AS `title`,`announcements`.`content` AS `content`,`announcements`.`publish_at` AS `publish_at` from `announcements` where ((`announcements`.`publish_at` <= now()) and ((`announcements`.`expire_at` is null) or (`announcements`.`expire_at` >= now()))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-19 20:52:46
