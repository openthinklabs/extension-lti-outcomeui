<?php
use oat\tao\helpers\Template;
use oat\tao\helpers\Layout;
?>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <title><?=__('Item Result Previewer');?></title>
        <?= Layout::getAmdLoader(Template::js('loader/ltiOutcomeUi.min.js', 'ltiOutcomeUi'), 'ltiOutcomeUi/controller/ItemResultPreviewer/itemResultPreviewer', get_data('data')) ?>
    </head>
    <body></body>
</html>